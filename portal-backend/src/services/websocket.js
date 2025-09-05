const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.connections = new Map(); // agent_id -> websocket
    this.setupServer();
  }

  setupServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection');

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
        // Remove connection from map
        for (const [agentId, socket] of this.connections.entries()) {
          if (socket === ws) {
            this.connections.delete(agentId);
            console.log(`📡 Agent ${agentId} disconnected`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
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
    const { id, name, hostname, platform, version, ip_address } = agentInfo;
    
    // Store connection
    this.connections.set(id, ws);
    
    // Update agent in database
    // This would typically update the database with agent info
    
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
}

module.exports = WebSocketService;