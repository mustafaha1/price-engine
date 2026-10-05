// Input sanitization middleware
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  for (var key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/[<>]/g, '')
        .trim()
        .substring(0, 500);
    }
  }
}

module.exports = { sanitizeInput };
