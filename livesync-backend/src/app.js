import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';
import restaurantRoutes from './routes/restaurants.js';
import menuRoutes from './routes/menu.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/menu', menuRoutes);

  app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body.' });
    console.error(err);
    if (err?.$metadata || err?.name?.endsWith('Exception') || err?.name === 'TimeoutError') {
      return res.status(503).json({ message: 'A storage service is temporarily unavailable.' });
    }
    res.status(500).json({ message: 'Something went wrong on the server.' });
  });

  return app;
}
