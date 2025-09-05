const crypto = require('crypto');

// Simple CSRF protection implementation
class CSRFProtection {
  constructor() {
    this.tokens = new Map(); // In production, use Redis or database
    this.tokenTimeout = 60 * 60 * 1000; // 1 hour
    
    // Clean up expired tokens every 15 minutes
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 15 * 60 * 1000);
  }

  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + this.tokenTimeout;
    
    this.tokens.set(token, { sessionId, expiry });
    return token;
  }

  validateToken(token, sessionId) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    if (Date.now() > tokenData.expiry) {
      this.tokens.delete(token);
      return false;
    }
    
    if (tokenData.sessionId !== sessionId) {
      return false;
    }
    
    // Token is valid, remove it (one-time use)
    this.tokens.delete(token);
    return true;
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiry) {
        this.tokens.delete(token);
      }
    }
  }

  getSessionId(req) {
    // Use JWT user ID as session identifier
    return req.user ? req.user.id.toString() : req.ip;
  }

  // Middleware to provide CSRF token
  provideToken() {
    return (req, res, next) => {
      const sessionId = this.getSessionId(req);
      const token = this.generateToken(sessionId);
      
      res.locals.csrfToken = token;
      
      // Also provide via header for API clients
      res.setHeader('X-CSRF-Token', token);
      
      next();
    };
  }

  // Middleware to validate CSRF token
  validateToken() {
    return (req, res, next) => {
      // Skip CSRF for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip for WebSocket upgrade requests
      if (req.headers.upgrade === 'websocket') {
        return next();
      }

      const sessionId = this.getSessionId(req);
      const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;

      if (!token) {
        return res.status(403).json({ 
          error: 'CSRF token required',
          details: 'Include X-CSRF-Token header or _csrf parameter'
        });
      }

      if (!this.validateToken(token, sessionId)) {
        return res.status(403).json({ 
          error: 'Invalid CSRF token',
          details: 'CSRF token is invalid or expired'
        });
      }

      next();
    };
  }
}

const csrfProtection = new CSRFProtection();

module.exports = {
  csrfProtection,
  provideCSRFToken: csrfProtection.provideToken(),
  validateCSRFToken: csrfProtection.validateToken()
};