const crypto = require('crypto');

// JWT secret management - ensure consistency across the application
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  // In development, use a consistent secret
  JWT_SECRET = 'dev-secret-vr-estranho-2024-do-not-use-in-production';
}

const AGENT_TOKEN = process.env.AGENT_TOKEN || 'vr-agent-secret-2024';

module.exports = {
  JWT_SECRET,
  AGENT_TOKEN
};