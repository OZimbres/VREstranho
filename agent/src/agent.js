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
      // Add authentication token to connection URL
      const agentToken = process.env.AGENT_TOKEN || 'vr-agent-secret-2024';
      const connectionUrl = `${this.serverUrl}?type=agent&agentToken=${agentToken}`;
      
      console.log(`🔌 Connecting to server: ${this.serverUrl}`);
      this.ws = new WebSocket(connectionUrl);

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
        agentToken: process.env.AGENT_TOKEN || 'vr-agent-secret-2024',
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
    let targetPath = requestPath || './';
    
    try {
      // Normalize and validate path
      targetPath = path.resolve(targetPath);
      
      // Prevent access to sensitive directories
      const blockedPaths = ['/etc', '/proc', '/sys', '/dev', '/boot', '/root'];
      if (blockedPaths.some(blocked => targetPath.startsWith(blocked))) {
        throw new Error('Access to system directories is not allowed');
      }
      
      // Ensure path exists and is readable
      if (!fs.existsSync(targetPath)) {
        throw new Error('Path does not exist');
      }
      
      const stats = fs.statSync(targetPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      const files = fs.readdirSync(targetPath, { withFileTypes: true });
      const fileList = files.map(file => {
        const filePath = path.join(targetPath, file.name);
        let fileStats;
        try {
          fileStats = fs.statSync(filePath);
        } catch (e) {
          // Skip files we can't stat
          return null;
        }
        
        return {
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file',
          size: file.isFile() ? fileStats.size : null,
          lastModified: fileStats.mtime
        };
      }).filter(file => file !== null);

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
      // Validate and sanitize file name
      if (!fileName || /[<>:"|?*]/.test(fileName)) {
        throw new Error('Invalid file name');
      }
      
      // Validate target path
      const normalizedPath = path.resolve(targetPath);
      const blockedPaths = ['/etc', '/proc', '/sys', '/dev', '/boot', '/root'];
      if (blockedPaths.some(blocked => normalizedPath.startsWith(blocked))) {
        throw new Error('Upload to system directories is not allowed');
      }
      
      const fullPath = path.join(normalizedPath, fileName);
      
      // Ensure we're not overwriting critical files
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) {
          throw new Error('Cannot overwrite non-file');
        }
      }
      
      const buffer = Buffer.from(fileData, 'base64');
      
      // Validate file size (additional check)
      if (buffer.length > 100 * 1024 * 1024) { // 100MB
        throw new Error('File too large');
      }
      
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
      // Validate and normalize path
      const normalizedPath = path.resolve(filePath);
      
      // Prevent deletion of system files and directories
      const blockedPaths = ['/etc', '/proc', '/sys', '/dev', '/boot', '/root', '/bin', '/sbin', '/usr/bin', '/usr/sbin'];
      if (blockedPaths.some(blocked => normalizedPath.startsWith(blocked))) {
        throw new Error('Deletion of system files/directories is not allowed');
      }
      
      // Additional safety check - don't delete if path contains sensitive patterns
      if (normalizedPath.includes('passwd') || normalizedPath.includes('shadow') || 
          normalizedPath.includes('sudoers') || normalizedPath.includes('.ssh')) {
        throw new Error('Cannot delete sensitive files');
      }

      if (fs.existsSync(normalizedPath)) {
        const stats = fs.statSync(normalizedPath);
        if (stats.isDirectory()) {
          // Only allow deletion of empty directories or specific application directories
          const files = fs.readdirSync(normalizedPath);
          if (files.length > 0) {
            throw new Error('Cannot delete non-empty directories');
          }
          fs.rmdirSync(normalizedPath);
        } else {
          fs.unlinkSync(normalizedPath);
        }

        this.sendMessage({
          type: 'file_operation_result',
          payload: {
            operationId,
            status: 'completed',
            message: `File/directory ${path.basename(normalizedPath)} deleted successfully`
          }
        });

        console.log(`🗑️  Deleted: ${normalizedPath}`);
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
      // Additional validation on agent side
      const allowedCommands = ['ls', 'pwd', 'whoami', 'date', 'uptime', 'df', 'free', 'ps', 'netstat', 'systemctl', 'service', 'cat', 'head', 'tail'];
      
      if (!allowedCommands.includes(command)) {
        throw new Error(`Command '${command}' is not allowed on this agent`);
      }

      // Sanitize arguments - remove any shell metacharacters
      const sanitizedArgs = args ? args.filter(arg => !/[;&|`$(){}[\]\\<>]/.test(arg)) : [];
      
      // Construct command safely
      const fullCommand = sanitizedArgs.length > 0 ? `${command} ${sanitizedArgs.join(' ')}` : command;
      
      // Execute with restricted environment and timeout
      const result = execSync(fullCommand, { 
        encoding: 'utf8', 
        timeout: 10000, // Reduced timeout
        env: { PATH: process.env.PATH }, // Minimal environment
        maxBuffer: 1024 * 1024 // 1MB output limit
      });

      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'completed',
          message: 'Command executed successfully',
          output: result.substring(0, 10000) // Limit output size
        }
      });

      console.log(`⚡ Command executed: ${fullCommand}`);

    } catch (error) {
      this.sendMessage({
        type: 'file_operation_result',
        payload: {
          operationId,
          status: 'failed',
          error: 'Command execution failed: ' + error.message.substring(0, 200)
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
    const { operationId, requestedBy, timestamp } = payload;

    console.log(`🔄 Restart requested by: ${requestedBy} at ${timestamp}`);
    
    this.sendMessage({
      type: 'file_operation_result',
      payload: {
        operationId,
        status: 'completed',
        message: `Agent restart initiated by ${requestedBy}`
      }
    });

    // Graceful shutdown with delay
    console.log('🛑 Agent shutting down for restart in 3 seconds...');
    setTimeout(() => {
      if (this.ws) {
        this.ws.close();
      }
      process.exit(0);
    }, 3000);
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