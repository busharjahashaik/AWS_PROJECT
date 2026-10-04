import crypto from 'node:crypto';
import { store } from '../store/index.js';

/** Record an entry shown on the Admin "Activity Logs" page. Never throws. */
export async function logActivity({ actor, action, orderId, status, details, ip }) {
  const id = `log-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  try {
    await store.addLog({
      logId: id,
      id,
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      orderId,
      status: status || 'OK',
      ipAddress: ip,
      details,
    });
  } catch (err) {
    console.warn('[activity] could not write log:', err.message);
  }
}
