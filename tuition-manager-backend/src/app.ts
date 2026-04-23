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

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Vite frontend URL
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


// Mount authentication routes

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);

// Global error handler (should be last)
app.use(errorHandler);

export default app;
// Express app configuration (CORS, JSON parsing)
