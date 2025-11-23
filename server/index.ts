import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDatabaseConnection } from './config/database.js';
import jobsRoutes from './routes/jobs.routes.js';
import settingsRoutes from './routes/settings.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/jobs', jobsRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('💎 Crystal Backend Server');
    console.log('='.repeat(60) + '\n');

    // Check database connection
    console.log('📡 Checking database connection...');
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      console.error('   Make sure PostgreSQL is running and DATABASE_URL is set correctly');
      process.exit(1);
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📊 API Base: http://localhost:${PORT}/api`);
      console.log('='.repeat(60) + '\n');

      console.log('📝 Available Endpoints:');
      console.log('  GET  /health - Health check');
      console.log('  GET  /api/jobs - Get all jobs');
      console.log('  GET  /api/jobs/stats - Get statistics');
      console.log('  GET  /api/jobs/source/:source - Get jobs by source');
      console.log('  POST /api/jobs/scrape - Trigger scraper');
      console.log('  GET  /api/jobs/scraper/status - Get scraper status');
      console.log('  GET  /api/settings/keywords - Get keywords');
      console.log('  PUT  /api/settings/keywords - Update keywords\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT signal received: closing server');
  process.exit(0);
});

// Start the server
startServer();

export default app;
