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

app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
