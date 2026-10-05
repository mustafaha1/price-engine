const jwt = require('jsonwebtoken');
const { getDb } = require('../models/database');

async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    if (db) {
      const { ObjectId } = require('mongodb');
      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
    } else {
      req.user = decoded;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requirePlan(plans) {
  return (req, res, next) => {
    const userPlan = req.user?.plan || 'free';
    if (!plans.includes(userPlan)) {
      return res.status(403).json({ error: 'Premium plan required', upgrade: true });
    }
    next();
  };
}

async function checkSearchLimit(req, res, next) {
  try {
    const user = req.user;
    if (!user || user.plan === 'pro' || user.plan === 'enterprise') return next();

    const db = getDb();
    if (!db) return next();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const searchCount = await db.collection('search_logs').countDocuments({
      user_id: user._id,
      searched_at: { $gte: today }
    });

    const limit = user.searches_limit || 10;
    if (searchCount >= limit) {
      return res.status(429).json({ error: 'Daily search limit reached', limit, used: searchCount, upgrade: true });
    }
    req.searchCount = searchCount;
    next();
  } catch (e) { next(); }
}

module.exports = { requireAuth, requirePlan, checkSearchLimit };
