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
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
import authRoutes from './routes/auth.routes';
import listingsRoutes from './routes/listings.routes';
import conversationsRoutes from './routes/conversations.routes';
import adminRoutes from './routes/admin.routes';
import usersRoutes from './routes/users.routes';
import reviewsRoutes from './routes/reviews.routes';
import uploadRoutes from './routes/upload.routes';
import stripeRoutes from './routes/stripe.routes';
import ordersRoutes from './routes/orders.routes';
import offersRoutes from './routes/offers.routes';
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

// Stripe webhooks need raw body — register BEFORE express.json() and rate limiters
app.use('/api/v1/webhooks', webhooksRoutes);

app.use(express.json());

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many attempts, please try again later' },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many requests, please try again later' },
});

app.use(globalLimiter);

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/listings', writeLimiter, listingsRoutes);
app.use('/api/v1/conversations', writeLimiter, conversationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/reviews', writeLimiter, reviewsRoutes);
app.use('/api/v1/upload', writeLimiter, uploadRoutes);
app.use('/api/v1/stripe', writeLimiter, stripeRoutes);
app.use('/api/v1/orders', writeLimiter, ordersRoutes);
app.use('/api/v1/offers', writeLimiter, offersRoutes);

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

// Sentry error handler (must be after all routes)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

export default app;
