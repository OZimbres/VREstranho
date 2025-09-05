const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Database = require('./database');
const { JWT_SECRET, AGENT_TOKEN } = require('../config/secrets');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      verifyClient: (info) => {
        // Allow agents to connect (they will authenticate later)
        // Human users must provide token in URL
        const url = new URL(info.req.url, `http://${info.req.headers.host}`);
        const token = url.searchParams.get('token');
        const clientType = url.searchParams.get('type');
        
        if (clientType === 'agent') {
          return true; // Allow agents, they authenticate with agent tokens
        }
        
        if (!token) {
          return false;
        }
        
        try {
          jwt.verify(token, JWT_SECRET);
          return true;
        } catch (error) {
          return false;
        }
      }
    });
    this.connections = new Map(); // agent_id -> websocket
    this.authenticatedUsers = new Map(); // websocket -> user_info
    this.db = new Database();
    this.setupServer();
  }

  setupServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection');
      
      // Parse connection URL to get client type and authentication
      const url = new URL(req.url, `http://${req.headers.host}`);
      const clientType = url.searchParams.get('type');
      const token = url.searchParams.get('token');
      
      // Set connection metadata
      ws.clientType = clientType;
      ws.isAuthenticated = false;
      
      // Authenticate human users immediately
      if (clientType !== 'agent' && token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          ws.user = decoded;
          ws.isAuthenticated = true;
          this.authenticatedUsers.set(ws, decoded);
          console.log(`✅ User ${decoded.username} authenticated via WebSocket`);
        } catch (error) {
          console.error('WebSocket authentication failed:', error);
          ws.close(1008, 'Authentication failed');
          return;
        }
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        // Remove connection from maps
        for (const [agentId, socket] of this.connections.entries()) {
          if (socket === ws) {
            this.connections.delete(agentId);
            console.log(`📡 Agent ${agentId} disconnected`);
            break;
          }
        }
        this.authenticatedUsers.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      // Send initial message
      ws.send(JSON.stringify({ 
        type: 'connection_established', 
        clientType: clientType || 'unknown',
        authenticated: ws.isAuthenticated
      }));
    });
  }

  handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'agent_register':
        this.registerAgent(ws, payload);
        break;
      case 'agent_status':
        this.updateAgentStatus(payload);
        break;
      case 'file_operation_result':
        this.handleFileOperationResult(payload);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  registerAgent(ws, agentInfo) {
    const { id, name, hostname, platform, version, ip_address, agentToken } = agentInfo;
    
    // Validate agent token
    if (agentToken !== AGENT_TOKEN) {
      ws.send(JSON.stringify({ 
        type: 'registration_failed', 
        message: 'Invalid agent token' 
      }));
      ws.close(1008, 'Authentication failed');
      return;
    }
    
    // Store connection
    this.connections.set(id, ws);
    ws.isAuthenticated = true;
    ws.agentId = id;
    
    // Update agent in database
    this.updateAgentInDatabase(agentInfo);
    
    ws.send(JSON.stringify({ 
      type: 'registration_success', 
      message: 'Agent registered successfully' 
    }));

    console.log(`✅ Agent registered: ${name} (${id})`);
  }

  updateAgentStatus(statusInfo) {
    // Update agent status in database
    console.log('Agent status update:', statusInfo);
  }

  handleFileOperationResult(result) {
    // Update file operation status in database
    console.log('File operation result:', result);
    
    // Broadcast to portal clients if needed
    this.broadcast('file_operation_update', result);
  }

  // Send command to specific agent
  sendToAgent(agentId, message) {
    const connection = this.connections.get(agentId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Broadcast message to all connected clients
  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Get list of online agents
  getOnlineAgents() {
    return Array.from(this.connections.keys());
  }

  async updateAgentInDatabase(agentInfo) {
    try {
      const { id, name, hostname, platform, version, ip_address } = agentInfo;
      await this.db.run(`
        INSERT OR REPLACE INTO agents 
        (id, name, hostname, platform, version, ip_address, status, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
      `, [id, name, hostname, platform, version, ip_address]);
    } catch (error) {
      console.error('Error updating agent in database:', error);
    }
  }
}

module.exports = WebSocketService;