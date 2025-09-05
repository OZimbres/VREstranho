const { body, param, query } = require('express-validator');

// Input sanitization helpers
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potentially dangerous characters
  return str.replace(/[<>'";&(){}[\]\\]|--|\*|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b/gi, '')
            .trim()
            .substring(0, 1000); // Limit length
};

const sanitizeId = (id) => {
  if (typeof id !== 'string') return id;
  // Allow only alphanumeric, hyphens, underscores
  return id.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 100);
};

// Common validation rules
const idValidation = param('id').isLength({ min: 1, max: 100 }).matches(/^[a-zA-Z0-9\-_]+$/);
const agentIdValidation = param('agentId').isLength({ min: 1, max: 100 }).matches(/^[a-zA-Z0-9\-_]+$/);

const usernameValidation = body('username')
  .isLength({ min: 3, max: 50 })
  .matches(/^[a-zA-Z0-9_-]+$/)
  .withMessage('Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens');

const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must be 8-128 characters with at least one uppercase, lowercase, and number');

const emailValidation = body('email')
  .optional()
  .isEmail()
  .isLength({ max: 254 })
  .normalizeEmail();

// Sanitization middleware
const sanitizeInputs = (req, res, next) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeId(req.params[key]);
      }
    }
  }

  next();
};

module.exports = {
  sanitizeInputs,
  sanitizeString,
  sanitizeId,
  idValidation,
  agentIdValidation,
  usernameValidation,
  passwordValidation,
  emailValidation
};