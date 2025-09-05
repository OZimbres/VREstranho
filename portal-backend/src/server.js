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
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // API Routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/agents', agentRoutes);
    this.app.use('/api/files', fileRoutes);
    this.app.use('/api/system', systemRoutes);

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
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