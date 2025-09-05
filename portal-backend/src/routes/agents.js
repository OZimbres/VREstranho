const express = require('express');
const Database = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const { AGENT_TOKEN } = require('../config/secrets');

const router = express.Router();
const db = new Database();

// Get all agents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const agents = await db.query(`
      SELECT 
        id, name, hostname, platform, version, status, 
        last_seen, ip_address, network_id, store_id, created_at
      FROM agents 
      ORDER BY last_seen DESC
    `);
    
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific agent
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const agents = await db.query('SELECT * FROM agents WHERE id = ?', [id]);
    const agent = agents[0];

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update agent info (typically called by the agent itself)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, hostname, platform, version, ip_address, network_id, store_id, agentToken } = req.body;

    // Validate agent token
    if (agentToken !== AGENT_TOKEN) {
      return res.status(401).json({ error: 'Invalid agent token' });
    }

    // Validate required fields
    if (!name || !hostname || !platform || !version) {
      return res.status(400).json({ error: 'Missing required agent information' });
    }

    // Validate IP address format
    if (ip_address && !ip_address.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return res.status(400).json({ error: 'Invalid IP address format' });
    }

    await db.run(`
      INSERT OR REPLACE INTO agents 
      (id, name, hostname, platform, version, ip_address, network_id, store_id, status, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
    `, [id, name, hostname, platform, version, ip_address, network_id, store_id]);

    res.json({ message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete agent
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run('DELETE FROM agents WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const fileOpsCount = await db.query(
      'SELECT COUNT(*) as count FROM file_operations WHERE agent_id = ?',
      [id]
    );
    
    const successfulOps = await db.query(
      'SELECT COUNT(*) as count FROM file_operations WHERE agent_id = ? AND status = "completed"',
      [id]
    );
    
    const failedOps = await db.query(
      'SELECT COUNT(*) as count FROM file_operations WHERE agent_id = ? AND status = "failed"',
      [id]
    );

    res.json({
      total_operations: fileOpsCount[0].count,
      successful_operations: successfulOps[0].count,
      failed_operations: failedOps[0].count
    });
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;