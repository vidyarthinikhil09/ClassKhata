// Express app configuration

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import transactionRoutes from './routes/transactionRoutes';

import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any vercel.app or onrender.com subdomain automatically
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// Mount authentication routes

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);

// Global error handler (should be last)
app.use(errorHandler);

export default app;
// Express app configuration (CORS, JSON parsing)
