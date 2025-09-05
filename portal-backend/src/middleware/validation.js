const { body, param, query, validationResult } = require('express-validator');

// Command whitelist for system operations
const ALLOWED_COMMANDS = {
  // Basic system commands
  'ls': ['-la', '-l', '-a'],
  'pwd': [],
  'whoami': [],
  'date': [],
  'uptime': [],
  'df': ['-h'],
  'free': ['-h'],
  'ps': ['aux', '-ef'],
  'netstat': ['-tuln'],
  
  // Service management (safe subset)
  'systemctl': ['status', 'is-active', 'is-enabled'],
  'service': ['status'],
  
  // Package management (read-only)
  'rpm': ['-qa', '-qi'],
  'dpkg': ['-l', '-s'],
  'apt': ['list'],
  'yum': ['list'],
  
  // File operations (safe subset)
  'cat': [],
  'head': [],
  'tail': [],
  'wc': ['-l', '-w', '-c'],
  'grep': ['-i', '-r', '-n'],
  'find': ['-name', '-type', '-size'],
  
  // Network diagnostics
  'ping': ['-c'],
  'nslookup': [],
  'dig': []
};

const validateCommand = (req, res, next) => {
  const { command, args = [] } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  // Check if command is in whitelist
  if (!ALLOWED_COMMANDS[command]) {
    return res.status(403).json({ 
      error: 'Command not allowed',
      allowedCommands: Object.keys(ALLOWED_COMMANDS)
    });
  }
  
  // Validate arguments
  const allowedArgs = ALLOWED_COMMANDS[command];
  for (const arg of args) {
    // Basic sanitization - no shell metacharacters
    if (/[;&|`$(){}[\]\\<>]/.test(arg)) {
      return res.status(400).json({ 
        error: 'Invalid characters in command arguments' 
      });
    }
    
    // Check if argument is in allowed list (if list is not empty)
    if (allowedArgs.length > 0 && !allowedArgs.some(allowed => arg.startsWith(allowed))) {
      return res.status(403).json({ 
        error: `Argument '${arg}' not allowed for command '${command}'`,
        allowedArgs: allowedArgs
      });
    }
  }
  
  next();
};

const validateFilePath = (req, res, next) => {
  const filePath = req.body.path || req.query.path || req.body.filePath;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }
  
  // Prevent path traversal
  if (filePath.includes('..') || filePath.includes('~') || filePath.startsWith('/etc') || 
      filePath.startsWith('/proc') || filePath.startsWith('/sys') || filePath.startsWith('/dev')) {
    return res.status(403).json({ 
      error: 'Access denied: Path traversal or system directory access not allowed' 
    });
  }
  
  // Ensure path is absolute and normalized
  const normalizedPath = require('path').resolve(filePath);
  if (normalizedPath !== filePath && !filePath.startsWith('./')) {
    return res.status(400).json({ 
      error: 'Invalid path format. Use absolute paths or relative paths starting with ./' 
    });
  }
  
  next();
};

const validateFileUpload = (req, res, next) => {
  const file = req.file;
  const { path: targetPath } = req.body;
  
  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }
  
  // File size validation (already handled by multer, but double-check)
  if (file.size > 100 * 1024 * 1024) { // 100MB
    return res.status(413).json({ error: 'File too large. Maximum size is 100MB' });
  }
  
  // File type validation
  const allowedMimeTypes = [
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-tar',
    'application/gzip'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(415).json({ 
      error: 'File type not allowed',
      allowedTypes: allowedMimeTypes
    });
  }
  
  // Validate filename
  if (/[<>:"|?*]/.test(file.originalname)) {
    return res.status(400).json({ error: 'Invalid characters in filename' });
  }
  
  // Validate target path
  if (targetPath && (targetPath.includes('..') || targetPath.startsWith('/etc') || 
      targetPath.startsWith('/proc') || targetPath.startsWith('/sys'))) {
    return res.status(403).json({ error: 'Invalid target path' });
  }
  
  next();
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

module.exports = {
  validateCommand,
  validateFilePath,
  validateFileUpload,
  handleValidationErrors,
  ALLOWED_COMMANDS
};