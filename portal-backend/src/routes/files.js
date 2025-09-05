const express = require('express');
const multer = require('multer');
const path = require('path');
const Database = require('../services/database');
const WebSocketService = require('../services/websocket');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Get file list from agent
router.get('/list/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { path: remotePath = '/' } = req.query;

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Send WebSocket message to agent requesting file list
    const wsService = req.app.get('wsService');
    const message = {
      type: 'file_list_request',
      path: remotePath,
      requestId: Date.now().toString()
    };

    const sent = wsService?.sendToAgent(agentId, message);
    if (!sent) {
      return res.status(503).json({ error: 'Agent is offline or unreachable' });
    }

    // In a real implementation, we'd wait for the WebSocket response
    // For now, return a mock response
    res.json({
      path: remotePath,
      files: [
        { name: 'vr.properties', type: 'file', size: 1024, lastModified: '2024-09-05T10:00:00Z' },
        { name: 'lib', type: 'directory', size: null, lastModified: '2024-09-05T09:00:00Z' },
        { name: 'config.ini', type: 'file', size: 512, lastModified: '2024-09-05T08:00:00Z' }
      ]
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download file from agent
router.get('/download/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log operation
    await db.run(
      'INSERT INTO file_operations (agent_id, operation_type, file_path, user_id) VALUES (?, ?, ?, ?)',
      [agentId, 'download', filePath, req.user.id]
    );

    // Send request to agent (mock response for demo)
    res.json({
      message: 'Download request sent to agent',
      filePath,
      agentId
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload file to agent
router.post('/upload/:agentId', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { path: targetPath } = req.body;
    const file = req.file;

    if (!file || !targetPath) {
      return res.status(400).json({ error: 'File and target path are required' });
    }

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log operation
    const operation = await db.run(
      'INSERT INTO file_operations (agent_id, operation_type, file_path, user_id) VALUES (?, ?, ?, ?)',
      [agentId, 'upload', targetPath, req.user.id]
    );

    // Send file to agent via WebSocket
    const wsService = req.app.get('wsService');
    const message = {
      type: 'file_upload',
      targetPath,
      fileName: file.originalname,
      fileData: file.buffer.toString('base64'),
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
      message: 'File upload initiated',
      operationId: operation.id,
      fileName: file.originalname,
      targetPath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete file on agent
router.delete('/delete/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { path: filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify agent exists
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [agentId]);
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Log operation
    const operation = await db.run(
      'INSERT INTO file_operations (agent_id, operation_type, file_path, user_id) VALUES (?, ?, ?, ?)',
      [agentId, 'delete', filePath, req.user.id]
    );

    // Send delete command to agent
    const wsService = req.app.get('wsService');
    const message = {
      type: 'file_delete',
      filePath,
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
      message: 'File deletion initiated',
      operationId: operation.id,
      filePath
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get file operations history
router.get('/operations', authenticateToken, async (req, res) => {
  try {
    const { agentId, limit = 50 } = req.query;

    let query = `
      SELECT fo.*, a.name as agent_name, u.username
      FROM file_operations fo
      LEFT JOIN agents a ON fo.agent_id = a.id
      LEFT JOIN users u ON fo.user_id = u.id
    `;
    let params = [];

    if (agentId) {
      query += ' WHERE fo.agent_id = ?';
      params.push(agentId);
    }

    query += ' ORDER BY fo.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const operations = await db.query(query, params);
    res.json(operations);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;