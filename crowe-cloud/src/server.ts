import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import redis from 'redis';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import subscriptionRoutes from './routes/subscription';
import projectRoutes from './routes/project';
import compilerRoutes from './routes/compiler';
import aiRoutes from './routes/ai';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhook';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authenticate } from './middleware/auth';

// Logger configuration
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Redis client for caching
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowe-cloud')
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Connect to Redis
redisClient.connect()
  .then(() => logger.info('Redis connected'))
  .catch(err => logger.error('Redis connection error:', err));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing - raw for Stripe webhooks
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/webhook', webhookRoutes);

// Protected routes
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/compile', authenticate, compilerRoutes);
app.use('/api/ai', authenticate, aiRoutes);

// Admin routes
app.use('/api/admin', authenticate, adminRoutes);

// WebSocket for real-time features
io.on('connection', (socket) => {
  logger.info('New WebSocket connection:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    logger.info(`Socket ${socket.id} joined project ${projectId}`);
  });
  
  socket.on('code-change', (data) => {
    socket.to(`project-${data.projectId}`).emit('code-update', data);
  });
  
  socket.on('disconnect', () => {
    logger.info('Socket disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 Crowe Cloud Platform running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
  });
  await mongoose.connection.close();
  await redisClient.quit();
  process.exit(0);
});

export { app, io, redisClient, logger };