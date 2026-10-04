/**
 * AWS AppSync client.
 *
 * Orders, users and dashboards go through the LiveSync REST API (see httpClient.ts).
 * AppSync is used for ONE thing: pushing live order events to the browser over a WebSocket.
 */
import { ConnectionStatus } from '../types';

export interface AppSyncConfig {
  endpoint: string;
  apiKey?: string;
  region: string;
  authType: 'API_KEY' | 'AMAZON_COGNITO_USER_POOLS';
  jwtToken?: string;
}

export const getAppSyncConfig = (): AppSyncConfig => {
  return {
    endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT || '',
    apiKey: import.meta.env.VITE_APPSYNC_API_KEY || '',
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    authType: 'API_KEY',
  };
};

/** True only when real AppSync values are present (the .env.example placeholders do not count). */
export const isAppSyncConfigured = (): boolean => {
  const config = getAppSyncConfig();
  if (!config.endpoint || !config.apiKey) return false;
  if (/example-api-id|xxxxxxxx/i.test(config.endpoint)) return false;
  if (config.apiKey.startsWith('da2-samplekey')) return false;
  return true;
};

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Executes a GraphQL query or mutation over HTTP against the AWS AppSync endpoint.
 */
export async function executeGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  authToken?: string
): Promise<T> {
  const config = getAppSyncConfig();

  if (!config.endpoint) {
    throw new Error('AWS AppSync endpoint is not configured. Check VITE_APPSYNC_ENDPOINT in your .env file.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = authToken;
  } else if (config.apiKey) {
    headers['x-api-key'] = config.apiKey;
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error from AppSync endpoint! status: ${response.status} ${response.statusText}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMessages = result.errors.map((e) => e.message).join('; ');
    throw new Error(`AppSync GraphQL Error: ${errorMessages}`);
  }

  if (!result.data) {
    throw new Error('No data returned from AppSync GraphQL operation.');
  }

  return result.data;
}

/**
 * AppSync real-time subscription over WebSocket (protocol: "graphql-ws" as used by AppSync).
 *
 * Handshake:
 *   1. Open wss://<api>.appsync-realtime-api.<region>.amazonaws.com/graphql?header=<base64>&payload=e30=
 *      where header = base64 of {"host": "<graphql host>", "x-api-key": "<key>"}
 *   2. Send  { type: "connection_init" }      -> receive "connection_ack"
 *   3. Send  { type: "start", id, payload }   -> receive "start_ack", then "data" frames
 *   Server also sends "ka" (keep-alive) frames, which we ignore.
 *
 * It reconnects automatically (1s, 2s, 4s ... up to 30s) until unsubscribe() is called.
 */
export class AppSyncWebSocketSubscription<T = unknown> {
  private ws: WebSocket | null = null;
  private closedByUser = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private readonly subscriptionId: string;

  constructor(
    private readonly query: string,
    private readonly variables: Record<string, unknown> = {},
    private readonly onData: (data: T) => void,
    private readonly onError?: (err: Error) => void,
    private readonly onStatus?: (status: ConnectionStatus) => void
  ) {
    this.subscriptionId = 'sub_' + Math.random().toString(36).substring(2, 11);
  }

  public connect(): void {
    this.closedByUser = false;
    this.open();
  }

  private open(): void {
    const config = getAppSyncConfig();
    if (!config.endpoint) {
      this.onError?.(new Error('Cannot establish AppSync WebSocket: endpoint not configured'));
      return;
    }

    try {
      const url = new URL(config.endpoint);
      const authHeader = { host: url.host, 'x-api-key': config.apiKey };
      const encode = (obj: unknown) => btoa(JSON.stringify(obj));

      // Default AppSync domains use /graphql; custom domains use /graphql/realtime.
      const isDefaultDomain = url.host.includes('appsync-api');
      const realtimeHost = url.host.replace('appsync-api', 'appsync-realtime-api');
      const realtimePath = isDefaultDomain ? url.pathname : url.pathname.replace(/\/?$/, '/realtime');
      const wsUrl = `wss://${realtimeHost}${realtimePath}?header=${encode(authHeader)}&payload=${encode({})}`;

      this.onStatus?.(this.retries === 0 ? 'CONNECTING' : 'RECONNECTING');
      const ws = new WebSocket(wsUrl, ['graphql-ws']);
      this.ws = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'connection_init' }));
      };

      ws.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (msg.type) {
          case 'connection_ack':
            ws.send(
              JSON.stringify({
                id: this.subscriptionId,
                type: 'start',
                payload: {
                  data: JSON.stringify({ query: this.query, variables: this.variables }),
                  extensions: { authorization: { host: url.host, 'x-api-key': config.apiKey } },
                },
              })
            );
            break;
          case 'start_ack':
            this.retries = 0;
            this.onStatus?.('CONNECTED');
            break;
          case 'data':
            try {
              this.onData(msg.payload.data as T);
            } catch (err) {
              console.error('AppSync data handler failed', err);
            }
            break;
          case 'connection_error':
          case 'error': {
            const detail = msg.payload?.errors?.[0]?.message || msg.payload?.errors?.[0]?.errorType || 'unknown error';
            this.onError?.(new Error(`AppSync ${msg.type}: ${detail}`));
            break;
          }
          default:
            break; // "ka" keep-alive and anything else
        }
      };

      ws.onerror = () => {
        this.onError?.(new Error('AppSync WebSocket connection error'));
      };

      ws.onclose = () => {
        this.ws = null;
        if (this.closedByUser) return;
        this.onStatus?.('DISCONNECTED');
        const delay = Math.min(30000, 1000 * 2 ** this.retries);
        this.retries += 1;
        this.retryTimer = setTimeout(() => this.open(), delay);
      };
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  public unsubscribe(): void {
    this.closedByUser = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    const ws = this.ws;
    this.ws = null;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: this.subscriptionId, type: 'stop' }));
    }
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  }
}
