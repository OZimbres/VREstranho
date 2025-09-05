const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

class VRAgent {
  constructor() {
    this.id = this.generateAgentId();
    this.name = this.generateAgentName();
    this.version = '1.0.0';
    this.ws = null;
    this.serverUrl = process.env.SERVER_URL || 'ws://localhost:3000';
    this.reconnectInterval = 5000; // 5 seconds
    this.heartbeatInterval = 30000; // 30 seconds
    this.isConnected = false;

    this.systemInfo = {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      totalMemory: os.totalmem(),
      networkInterfaces: os.networkInterfaces()
    };

    console.log(`🤖 VR Estranho Agent v${this.version}`);
    console.log(`📋 Agent ID: ${this.id}`);
    console.log(`🖥️  Name: ${this.name}`);
    console.log(`🌐 Platform: ${this.systemInfo.platform}`);
  }

  generateAgentId() {
    // Use MAC address or generate UUID
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.mac !== '00:00:00:00:00:00') {
          return `agent-${iface.mac.replace(/:/g, '-')}`;
        }
      }
    }
    return `agent-${uuidv4()}`;
  }

  generateAgentName() {
    const hostname = os.hostname();
    const platform = os.platform();
    return `PDV-${hostname}-${platform}`.toUpperCase();
  }

  connect() {
    try {
      console.log(`🔌 Connecting to server: ${this.serverUrl}`);
      this.ws = new WebSocket(this.serverUrl);

      this.ws.on('open', () => {
        console.log('✅ Connected to VR Estranho Portal');
        this.isConnected = true;
        this.registerAgent();
        this.startHeartbeat();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('❌ Connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Connection error:', error);
      this.scheduleReconnect();
    }
  }

  registerAgent() {
    const registrationData = {
      type: 'agent_register',
      payload: {
        id: this.id,
        name: this.name,
        hostname: this.systemInfo.hostname,
        platform: this.systemInfo.platform,
        version: this.version,
        ip_address: this.getLocalIP(),
        ...this.systemInfo
      }
    };

    this.sendMessage(registrationData);
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      for (const iface of interfaces[name]) {
        if (!iface.internal && iface.family === 'IPv4') {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  handleMessage(message) {
    const { type, payload } = message;
    console.log(`📨 Received message: ${type}`);

    switch (type) {
      case 'registration_success':
        console.log('✅ Agent registered successfully');
        break;

      case 'ping':
        this.sendMessage({ type: 'pong', timestamp: Date.now() });
        break;

      case 'file_list_request':
        this.handleFileListRequest(payload);
        break;

      case 'file_upload':
        this.handleFileUpload(payload);
        break;

      case 'file_delete':
        this.handleFileDelete(payload);
        break;

      case 'execute_command':
        this.handleExecuteCommand(payload);
        break;

      case 'install_package':
        this.handleInstallPackage(payload);
        break;

      case 'system_info_request':
        this.handleSystemInfoRequest(payload);
        break;

      case 'restart_agent':
        this.handleRestartAgent(payload);
        break;

      default:
        console.log(`⚠️  Unknown message type: ${type}`);
    }
  }

  handleFileListRequest(payload) {
    const { path: requestPath, requestId } = payload;
    const targetPath = requestPath || '/';

    try {
      const files = fs.readdirSync(targetPath, { withFileTypes: true });
      const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file',
        size: file.isFile() ? fs.statSync(path.join(targetPath, file.name)).size : null,
        lastModified: fs.statSync(path.join(targetPath, file.name)).mtime
      }));

      this.sendMessage({
        type: 'file_list_response',
        requestId,
        payload: { path: targetPath, files: fileList }
      });

    } catch (error) {
      this.sendMessage({
        type: 'file_list_error',
        requestId,
        payload: { error: error.message }
      });
    }
  }

  handleFileUpload(payload) {
    const { targetPath, fileName, fileData, operationId } = payload;
    
    try {
      const fullPath = path.join(targetPath, fileName);
      const buffer = Buffer.from(fileData, 'base64');
      
      // Create directory if it doesn't exist
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      
      // Write file
      fs.writeFileSync(fullPath, buffer);

      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'completed',
          message: `File ${fileName} uploaded successfully`
        }
      });

      console.log(`📁 File uploaded: ${fullPath}`);

    } catch (error) {
      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  handleFileDelete(payload) {
    const { filePath, operationId } = payload;

    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }

        this.sendMessage({
          type: 'file_operation_result',
          payload: {
            operationId,
            status: 'completed',
            message: `File/directory ${filePath} deleted successfully`
          }
        });

        console.log(`🗑️  Deleted: ${filePath}`);
      } else {
        throw new Error('File not found');
      }

    } catch (error) {
      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  handleExecuteCommand(payload) {
    const { command, args, operationId } = payload;

    try {
      const fullCommand = args ? `${command} ${args.join(' ')}` : command;
      const result = execSync(fullCommand, { encoding: 'utf8', timeout: 30000 });

      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'completed',
          message: 'Command executed successfully',
          output: result
        }
      });

      console.log(`⚡ Command executed: ${fullCommand}`);

    } catch (error) {
      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  handleInstallPackage(payload) {
    const { packageName, packageUrl, installPath, operationId } = payload;

    try {
      // This is a simplified implementation
      // In a real scenario, you'd handle different package types and installation methods
      console.log(`📦 Installing package: ${packageName}`);
      
      // Mock installation
      setTimeout(() => {
        this.sendMessage({
          type: 'file_operation_result',
          payload: {
            operationId,
            status: 'completed',
            message: `Package ${packageName} installed successfully`
          }
        });
      }, 2000);

    } catch (error) {
      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  handleSystemInfoRequest(payload) {
    const { requestId } = payload;

    try {
      const systemInfo = {
        ...this.systemInfo,
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        cpus: os.cpus()
      };

      this.sendMessage({
        type: 'system_info_response',
        requestId,
        payload: systemInfo
      });

    } catch (error) {
      this.sendMessage({
        type: 'system_info_error',
        requestId,
        payload: { error: error.message }
      });
    }
  }

  handleRestartAgent(payload) {
    const { operationId } = payload;

    console.log('🔄 Restarting agent...');
    
    this.sendMessage({
      type: 'file_operation_result',
      payload: {
        operationId,
        status: 'completed',
        message: 'Agent restart initiated'
      }
    });

    // Close connection and restart
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'agent_status',
          payload: {
            id: this.id,
            status: 'online',
            timestamp: Date.now()
          }
        });
      }
    }, this.heartbeatInterval);
  }

  scheduleReconnect() {
    console.log(`🔄 Reconnecting in ${this.reconnectInterval / 1000} seconds...`);
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  start() {
    console.log('🚀 Starting VR Estranho Agent...');
    this.connect();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down agent...');
      if (this.ws) {
        this.ws.close();
      }
      process.exit(0);
    });
  }
}

// Start the agent
const agent = new VRAgent();
agent.start();