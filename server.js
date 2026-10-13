const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' }
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com", "https://partner.googleadservices.com", "https://tpc.googlesyndication.com", "https://www.googletagservices.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:", "blob:", "/uploads", "https://pagead2.googlesyndication.com"],
      connectSrc: ["'self'", "https://pagead2.googlesyndication.com"],
      frameSrc: ["'self'", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') sanitizeObject(req.body);
  if (req.query && typeof req.query === 'object') sanitizeObject(req.query);
  next();
}

function sanitizeObject(obj) {
  for (var key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/[<>]/g, '').trim().substring(0, 500);
    }
  }
}

app.use(sanitizeInput);

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', database: 'SQLite', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, require('./auth'));
app.use('/api/search', require('./search'));
app.use('/api/favorites', require('./favorites'));
app.use('/api/upload', require('./upload'));

// Redirect endpoint for shared links — ensures shared product URLs always work
app.get('/out', (req, res) => {
  var targetUrl = req.query.url;
  if (!targetUrl) {
    return res.redirect('/');
  }
  try {
    var decoded = decodeURIComponent(targetUrl);
    // Add Amazon affiliate tag if it's an Amazon link without one
    if (decoded.includes('amazon.com') || decoded.includes('amazon.')) {
      var separator = decoded.includes('?') ? '&' : '?';
      if (!decoded.includes('tag=')) {
        decoded += separator + 'tag=priceeengine08-20';
      }
    }
    // Add eBay affiliate tag if it's an eBay ITEM link (not search page)
    // campid only works on /itm/ pages, causes kick-out on /sch/ search pages
    if ((decoded.includes('ebay.com') || decoded.includes('ebay.')) && decoded.includes('/itm/')) {
      var sep = decoded.includes('?') ? '&' : '?';
      if (!decoded.includes('campid=')) {
        decoded += sep + 'campid=5339220900&mkevt=1&toolid=80005&mkcid=1';
      }
    }
    // Return HTML page with PriceEngine title + JS replace()
    // window.location.replace() removes this /out page from browser history
    // So when user taps BACK from the store, they go straight to PriceEngine
    res.send('<!DOCTYPE html><html><head><title>PriceEngine</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;text-align:center;padding:60px 20px;color:#333;background:#fff}' +
      '.logo{font-size:22px;font-weight:800;color:#1B1F3B;margin-bottom:12px;letter-spacing:-0.3px}' +
      '.msg{color:#888;font-size:14px}</style></head><body>' +
      '<div class="logo">PriceEngine</div>' +
      '<div class="msg">Redirecting to store...</div>' +
      '<script>window.location.replace("' + decoded.replace(/"/g, '&quot;') + '");</script>' +
      '</body></html>');
  } catch (e) {
    res.redirect('/');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Server running on port ' + PORT);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
