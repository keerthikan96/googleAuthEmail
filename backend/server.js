const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import configurations and middleware
const { connectDB, logger } = require('./config/database');
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');
const { 
  errorHandler, 
  notFoundHandler, 
  apiRateLimit,
  requestLogger 
} = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses when behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://localhost:*", "http://localhost:*"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://accounts.google.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Rate limiting
app.use('/api/', apiRateLimit);

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns server health status and basic information
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: '2025-06-20T10:30:00Z'
 *                         uptime:
 *                           type: number
 *                           description: 'Server uptime in seconds'
 *                           example: 3600
 *                         environment:
 *                           type: string
 *                           example: 'development'
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     tags: [Health]
 *     summary: API status endpoint
 *     description: Returns detailed API status including service availability
 *     responses:
 *       200:
 *         description: API status information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                           example: '1.0.0'
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: '2025-06-20T10:30:00Z'
 *                         services:
 *                           type: object
 *                           properties:
 *                             database:
 *                               type: string
 *                               example: 'connected'
 *                             authentication:
 *                               type: string
 *                               example: 'available'
 *                             gmail:
 *                               type: string
 *                               example: 'available'
 */
// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gmail Viewer API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      authentication: 'available',
      gmail: 'available'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/users', userRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    logger.info('HTTP server closed.');
    
    // Close database connection
    const { sequelize } = require('./config/database');
    sequelize.close()
      .then(() => {
        logger.info('Database connection closed.');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error closing database connection:', err);
        process.exit(1);
      });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown on SIGTERM and SIGINT
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Helper function to generate self-signed certificates
const generateSelfSignedCertificates = async (keyPath, certPath) => {
  const { execSync } = require('child_process');
  
  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
    
    logger.info('Self-signed certificates generated successfully');
  } catch (error) {
    logger.error('Failed to generate self-signed certificates:', error);
    logger.info('You can manually generate certificates using:');
    logger.info(`  openssl genrsa -out "${keyPath}" 2048`);
    logger.info(`  openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`);
    throw error;
  }
};

// Helper function to log available endpoints
const logEndpoints = (protocol, host, port) => {
  logger.info('Available endpoints:');
  logger.info(`  GET  ${protocol}://${host}:${port}/health - Health check`);
  logger.info(`  GET  ${protocol}://${host}:${port}/api/status - API status`);
  logger.info(`  GET  ${protocol}://${host}:${port}/api-docs - Swagger API Documentation`);
  logger.info(`  POST ${protocol}://${host}:${port}/api/auth/google - Start Google OAuth`);
  logger.info(`  GET  ${protocol}://${host}:${port}/api/auth/callback - OAuth callback`);
  logger.info(`  GET  ${protocol}://${host}:${port}/api/emails - Get user emails`);
  logger.info(`  POST ${protocol}://${host}:${port}/api/emails/sync - Sync emails from Gmail`);
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    // Connect to database
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create certs directory if it doesn't exist
    const certsDir = path.join(__dirname, 'certs');
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }    // HTTPS configuration
    let server;
    let useHTTPS = process.env.USE_HTTPS === 'true';
    
    if (useHTTPS) {
      try {
        // SSL certificate configuration
        const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'certs', 'server.key');
        const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'certs', 'server.cert');
        
        // Check if certificates exist
        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
          logger.warn('SSL certificates not found. Generating self-signed certificates...');
          await generateSelfSignedCertificates(keyPath, certPath);
        }

        const httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        };

        // Start HTTPS server
        server = https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
          logger.info(`Gmail Viewer API server is running securely on https://${HOST}:${PORT}`);
          logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
          logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
          logger.info(`API Documentation: https://${HOST}:${PORT}/api-docs`);
          logEndpoints('https', HOST, PORT);
        });
      } catch (error) {
        logger.error('Failed to start HTTPS server:', error);
        logger.info('Falling back to HTTP server...');
        useHTTPS = false;
      }
    }
    
    if (!useHTTPS) {
      // Start HTTP server
      server = app.listen(PORT, HOST, () => {
        logger.info(`Gmail Viewer API server is running on http://${HOST}:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
        logger.info(`API Documentation: http://${HOST}:${PORT}/api-docs`);
        logEndpoints('http', HOST, PORT);
      });
    }

    // Store server reference for graceful shutdown
    global.server = server;

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
