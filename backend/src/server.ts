import * as dotenv from 'dotenv';
import path from 'path';

// Load environmental configurations
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Backup config loading from backend directory if root is missing
dotenv.config();

import app from './app';
import prisma from './config/prisma';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify DB connectivity
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle unhandled exceptions globally
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION: Shutting down...', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION: Shutting down...', reason);
  process.exit(1);
});

bootstrap();
