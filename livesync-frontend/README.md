# LiveSync Frontend (React + TypeScript + Vite + Tailwind)

## Run

1. Start the backend first (see `livesync-backend/README.md`) — it listens on http://localhost:5000.
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 and sign in with a demo account:

| Role | Email | Password |
|---|---|---|
| Admin | admin@livesync.io | admin123 |
| Customer | customer@gmail.com | customer123 |
| Delivery | delivery@express.com | delivery123 |

## Modes (`.env`)

- `VITE_USE_MOCK_DATA=false` (default here): real backend + database.
- `VITE_USE_MOCK_DATA=true`: offline demo with fake data stored in the browser. No backend needed. Handy as a fallback if the network fails during your review.

Restart `npm run dev` after editing `.env`.

## Real-time

- Without AppSync keys the app refreshes orders every 5 seconds.
- With `VITE_APPSYNC_ENDPOINT` and `VITE_APPSYNC_API_KEY` set (same values as the backend), updates arrive instantly over a WebSocket and the refresh drops to a 30-second safety net.

## What changed from the original zip

Only the data layer; no page or component design was touched.

- `src/api/httpClient.ts` (new): fetch wrapper that sends the JWT.
- `src/services/authService.ts`, `orderService.ts`, `customerService.ts`, `deliveryService.ts`: the real branch now calls the REST API.
- `src/api/appSyncClient.ts`: correct AppSync WebSocket handshake plus auto-reconnect.
- `src/services/subscriptionService.ts`: one shared AppSync connection mapped to the existing event types.
- `src/context/OrderContext.tsx`: loads orders per signed-in user, polls, and ignores events that belong to other users.
- `src/context/AuthContext.tsx`: signs the user out when the server says the session expired.
