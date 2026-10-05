const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');

router.get('/trending', async (req, res) => {
  try {
    const db = getDb();
    if (db) {
      const products = await db.collection('products').find().sort({ search_count: -1 }).limit(20).toArray();
      return res.json({ products });
    }
    res.json({ products: [] });
  } catch (err) {
    res.json({ products: [] });
  }
});

module.exports = router;
