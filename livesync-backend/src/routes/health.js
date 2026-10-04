import { Router } from 'express';
import { store } from '../store/index.js';
import { appsyncEnabled } from '../services/appsync.js';
import { ah } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) =>
  res.json({ status: 'ok', store: store.name, appsyncPublishing: appsyncEnabled(), time: new Date().toISOString() })
);

// Checks that the database is reachable (for DynamoDB: that all tables exist).
router.get(
  '/db',
  ah(async (req, res) => {
    try {
      res.json(await store.ping());
    } catch (err) {
      console.error('[health] database check failed:', err);
      res.status(503).json({ ok: false, store: store.name, error: 'Database is temporarily unavailable.' });
    }
  })
);

export default router;
