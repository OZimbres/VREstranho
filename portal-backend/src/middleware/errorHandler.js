const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: isDevelopment ? err.message : 'Invalid input data'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid data format',
      details: isDevelopment ? err.message : 'Invalid identifier format'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: 'Data conflict',
      details: isDevelopment ? err.message : 'Resource already exists'
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Resource not found',
      details: isDevelopment ? err.message : 'The requested resource was not found'
    });
  }

  if (err.code === 'EACCES') {
    return res.status(403).json({
      error: 'Access denied',
      details: isDevelopment ? err.message : 'Insufficient permissions to access resource'
    });
  }

  if (err.code === 'EMFILE' || err.code === 'ENFILE') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      details: 'System resource limit reached'
    });
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    details: isDevelopment ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};