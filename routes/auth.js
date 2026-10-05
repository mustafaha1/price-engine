const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDb } = require('../models/database');
const { requireAuth } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, plan: user.plan || 'free' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      plan: 'free',
      searches_limit: 10,
      alerts_limit: 3,
      favorites: [],
      created_at: new Date()
    });

    const user = await db.collection('users').findOne({ _id: result.insertedId });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { last_login: new Date() } }
    );

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (db) {
      const user = await db.collection('users').findOne(
        { _id: req.user._id },
        { projection: { password: 0 } }
      );
      return res.json({ user });
    }
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.post('/favorites', requireAuth, async (req, res) => {
  try {
    const { product } = req.body;
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    await db.collection('users').updateOne(
      { _id: req.user._id },
      { $addToSet: { favorites: product } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.get('/favorites', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (db) {
      const user = await db.collection('users').findOne(
        { _id: req.user._id },
        { projection: { favorites: 1 } }
      );
      return res.json({ favorites: user?.favorites || [] });
    }
    res.json({ favorites: [] });
  } catch (err) {
    res.json({ favorites: [] });
  }
});

module.exports = router;
