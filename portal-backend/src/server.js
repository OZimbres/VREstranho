const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const fileRoutes = require('./routes/files');
const systemRoutes = require('./routes/system');

const Database = require('./services/database');
const WebSocketService = require('./services/websocket');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeInputs } = require('./middleware/sanitization');
const { provideCSRFToken, validateCSRFToken } = require('./middleware/csrf');

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 3000;
    
    // Initialize database
    this.db = new Database();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['X-CSRF-Token']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        details: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
    this.app.use('/api/', limiter);

    // Input sanitization (before parsing)
    this.app.use(sanitizeInputs);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (e) {
          res.status(400).json({ error: 'Invalid JSON format' });
          throw new Error('Invalid JSON');
        }
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 50 // Limit URL parameters
    }));

    // CSRF protection (after authentication)
    this.app.use(provideCSRFToken);
  }

  setupRoutes() {
    // API Routes with CSRF protection for state-changing operations
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/agents', agentRoutes);
    this.app.use('/api/files', validateCSRFToken, fileRoutes);
    this.app.use('/api/system', validateCSRFToken, systemRoutes);

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });

    // CSRF token endpoint
    this.app.get('/api/csrf-token', (req, res) => {
      res.json({
        csrfToken: res.locals.csrfToken,
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use(notFoundHandler);
    
    // Error handler (must be last)
    this.app.use(errorHandler);
  }

  setupWebSocket() {
    this.wsService = new WebSocketService(this.server);
  }

  async start() {
    try {
      // Initialize database
      await this.db.initialize();
      
      this.server.listen(this.port, () => {
        console.log(`🚀 VR Estranho API Server running on port ${this.port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 WebSocket enabled for real-time communication`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start();

module.exports = Server;