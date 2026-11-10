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
  const targetUrl = req.query.url;
  if (typeof targetUrl !== 'string' || !targetUrl || targetUrl.length > 8192) {
    return res.redirect('/');
  }
  try {
    // Express has already decoded the query parameter. Avoid decoding twice.
    const destination = new URL(targetUrl);
    if (!['https:', 'http:'].includes(destination.protocol) ||
        destination.username || destination.password) {
      return res.redirect('/');
    }
    const hostname = destination.hostname.toLowerCase().replace(/^www\./, '');
    // Preserve existing Amazon fallback behaviour, without matching fake hosts.
    if ((hostname === 'amazon.com' || hostname.startsWith('amazon.')) &&
        !destination.searchParams.has('tag')) {
      destination.searchParams.set('tag', 'priceengine08-20');
    }
    let finalUrl = destination.toString();
    // Use the central affiliate service for genuine eBay URLs only.
    // UK/DE item and search links use EPN-verified marketplace parameters.
    if (hostname === 'ebay.com' || hostname.startsWith('ebay.')) {
      finalUrl = require('./affiliateService').addAffiliateLink({
        source: 'eBay', product_url: finalUrl
      }).product_url;
    }
    // JSON string literal + HTML-safe escaping prevents script injection.
    const safeUrl = JSON.stringify(finalUrl)
      .replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    res.set('Cache-Control', 'no-store');
    res.send('<!DOCTYPE html><html><head><title>PriceEngine</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;text-align:center;padding:60px 20px;color:#333;background:#fff}' +
      '.logo{font-size:22px;font-weight:800;color:#1B1F3B;margin-bottom:12px;letter-spacing:-0.3px}' +
      '.msg{color:#888;font-size:14px}</style></head><body>' +
      '<div class="logo">PriceEngine</div>' +
      '<div class="msg">Redirecting to store...</div>' +
      '<script>window.location.replace(' + safeUrl + ');</script>' +
      '</body></html>');
  } catch (e) {
    return res.redirect('/');
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
