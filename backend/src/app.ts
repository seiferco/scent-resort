import dotenv from 'dotenv';
import path from 'path';

// Load .env.local — try multiple resolution strategies
const backendDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendDir, '.env.local') });
dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import listingsRoutes from './routes/listings.routes';
import conversationsRoutes from './routes/conversations.routes';
import adminRoutes from './routes/admin.routes';
import usersRoutes from './routes/users.routes';
import reviewsRoutes from './routes/reviews.routes';
import uploadRoutes from './routes/upload.routes';
import stripeRoutes from './routes/stripe.routes';
import ordersRoutes from './routes/orders.routes';
import webhooksRoutes from './routes/webhooks.routes';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Stripe webhooks need raw body — register BEFORE express.json()
app.use('/api/v1/webhooks', webhooksRoutes);

app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/orders', ordersRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Internal cron endpoint for escrow processing
app.post('/api/v1/internal/cron/process-escrow', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    const { runEscrowCron } = await import('./services/escrow.service');
    const results = await runEscrowCron();
    res.json({ status: 'ok', ...results });
  } catch (err) {
    console.error('Escrow cron error:', err);
    res.status(500).json({ error: 'server_error', message: 'Escrow cron failed' });
  }
});

export default app;
