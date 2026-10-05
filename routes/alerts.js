const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');
const { requireAuth } = require('../middleware/auth');

router.post('/', async (req, res) => {
  try {
    const { email, product_url, product_id, target_price, product_title, product_image } = req.body;
    if (!email || !product_url) return res.status(400).json({ error: 'Email and product URL are required' });

    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const userId = req.user?._id || null;

    if (userId) {
      const user = await db.collection('users').findOne({ _id: userId });
      const limit = user?.alerts_limit || 3;
      const count = await db.collection('price_alerts').countDocuments({ user_id: userId, active: true });
      if (count >= limit) return res.status(429).json({ error: 'Alert limit reached', limit, used: count });
    }

    const alert = {
      email, product_url, product_id: product_id || null,
      product_title: product_title || 'Unknown Product',
      product_image: product_image || '',
      target_price: target_price ? parseFloat(target_price) : null,
      current_price: null, source: req.body.source || 'unknown',
      active: true, user_id: userId,
      created_at: new Date(), last_checked: null, triggered_at: null
    };

    const result = await db.collection('price_alerts').insertOne(alert);
    res.status(201).json({ id: result.insertedId, message: 'Alert created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create alert', message: err.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.json({ alerts: [] });
    const alerts = await db.collection('price_alerts').find({ user_id: req.user._id, active: true }).sort({ created_at: -1 }).toArray();
    res.json({ alerts });
  } catch (err) {
    res.json({ alerts: [] });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    const db = getDb();
    if (db) {
      await db.collection('price_alerts').updateOne(
        { _id: new ObjectId(id), user_id: req.user._id },
        { $set: { active: false } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;
