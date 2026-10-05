require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectDatabase } = require('./models/database');
const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/sanitize');
const cronJobs = require('./utils/cronJobs');

const searchRoutes = require('./routes/search');
const compareRoutes = require('./routes/compare');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const premiumRoutes = require('./routes/premium');
const alertsRoutes = require('./routes/alerts');
const apiRoutes = require('./routes/api');
const dealsRoutes = require('./routes/deals');
const imageSearchRoutes = require('./routes/imageSearch');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Security: Helmet with safe CSP for our frontend
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:", "blob:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Security: CORS - allow same-origin only in production
if (isDev) {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({ origin: false })); // Production: same-origin only
}

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(isDev ? 'dev' : 'combined'));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Security: Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Security: Hide powered-by header
app.disable('x-powered-by');

// Security: Sanitize all inputs
app.use(sanitizeInput);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/search', searchRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/image-search', imageSearchRoutes);
app.use('/api/health', healthRoutes);

// SPA fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    cronJobs.start();
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('  Global Price Comparison Engine v2.0');
      console.log('  Mode:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
      console.log('========================================');
      console.log('  Server: http://localhost:' + PORT);
      console.log('  Health: http://localhost:' + PORT + '/api/health');
      console.log('========================================\n');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
