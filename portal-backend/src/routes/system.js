const express = require('express');
const Database = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Execute command on agent
router.post('/execute/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { command, args = [] } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log operation
    const operation = await db.run(
      'INSERT INTO file_operations (agent_id, operation_type, file_path, user_id) VALUES (?, ?, ?, ?)',
      [agentId, 'execute', command, req.user.id]
    );

    // Send command to agent
    const wsService = req.app.get('wsService');
    const message = {
      type: 'execute_command',
      command,
      args,
      operationId: operation.id
    };

    const sent = wsService?.sendToAgent(agentId, message);
    if (!sent) {
      await db.run(
        'UPDATE file_operations SET status = ?, error_message = ? WHERE id = ?',
        ['failed', 'Agent offline', operation.id]
      );
      return res.status(503).json({ error: 'Agent is offline or unreachable' });
    }

    res.json({
      message: 'Command execution initiated',
      operationId: operation.id,
      command
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Install application on agent
router.post('/install/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { packageName, packageUrl, installPath } = req.body;

    if (!packageName) {
      return res.status(400).json({ error: 'Package name is required' });
    }

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log operation
    const operation = await db.run(
      'INSERT INTO file_operations (agent_id, operation_type, file_path, user_id) VALUES (?, ?, ?, ?)',
      [agentId, 'install', packageName, req.user.id]
    );

    // Send install command to agent
    const wsService = req.app.get('wsService');
    const message = {
      type: 'install_package',
      packageName,
      packageUrl,
      installPath,
      operationId: operation.id
    };

    const sent = wsService?.sendToAgent(agentId, message);
    if (!sent) {
      await db.run(
        'UPDATE file_operations SET status = ?, error_message = ? WHERE id = ?',
        ['failed', 'Agent offline', operation.id]
      );
      return res.status(503).json({ error: 'Agent is offline or unreachable' });
    }

    res.json({
      message: 'Package installation initiated',
      operationId: operation.id,
      packageName
    });
  } catch (error) {
    console.error('Error installing package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system info from agent
router.get('/info/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Send system info request to agent
    const wsService = req.app.get('wsService');
    const message = {
      type: 'system_info_request',
      requestId: Date.now().toString()
    };

    const sent = wsService?.sendToAgent(agentId, message);
    if (!sent) {
      return res.status(503).json({ error: 'Agent is offline or unreachable' });
    }

    // Mock response for demo
    res.json({
      agent: agents[0],
      systemInfo: {
        platform: agents[0].platform,
        hostname: agents[0].hostname,
        uptime: '2 days, 3 hours',
        memory: '8GB',
        disk: '500GB (60% used)',
        cpu: 'Intel Core i5',
        processes: 156
      }
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restart agent service
router.post('/restart/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log operation
    const operation = await db.run(
      'INSERT INTO file_operations (agent_id, operation_type, file_path, user_id) VALUES (?, ?, ?, ?)',
      [agentId, 'restart', 'agent_service', req.user.id]
    );

    // Send restart command to agent
    const wsService = req.app.get('wsService');
    const message = {
      type: 'restart_agent',
      operationId: operation.id
    };

    const sent = wsService?.sendToAgent(agentId, message);
    if (!sent) {
      await db.run(
        'UPDATE file_operations SET status = ?, error_message = ? WHERE id = ?',
        ['failed', 'Agent offline', operation.id]
      );
      return res.status(503).json({ error: 'Agent is offline or unreachable' });
    }

    res.json({
      message: 'Agent restart initiated',
      operationId: operation.id
    });
  } catch (error) {
    console.error('Error restarting agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;