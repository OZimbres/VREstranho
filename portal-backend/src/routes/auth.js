const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../services/database');
const { JWT_SECRET } = require('../config/secrets');
const { usernameValidation, passwordValidation, emailValidation, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();
const db = new Database();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Input validation
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Invalid username length' });
    }

    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Invalid password length' });
    }

    // Find user
    const users = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      // Use same response time for both cases to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000) // Ensure consistent timestamps
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Don't send sensitive information
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service temporarily unavailable' });
  }
});

// Register endpoint (for creating new users)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Input validation
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores and hyphens' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!['user', 'operator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check for existing user
    const existingUsers = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password with higher cost for better security
    const passwordHash = bcrypt.hashSync(password, 12);

    // Create user
    const result = await db.run(
      'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
      [username, passwordHash, email, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.id,
        username,
        email,
        role
      }
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'User registration service temporarily unavailable' });
    }
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const users = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;