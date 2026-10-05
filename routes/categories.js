const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    if (db) {
      const categories = await db.collection('categories').find().sort({ sort_order: 1 }).toArray();
      return res.json({ categories });
    }
    res.json({ categories: [
      { name: 'electronics', display_name: 'Electronics & Gadgets', icon: 'fa-laptop', sort_order: 1 },
      { name: 'fashion', display_name: 'Fashion & Clothing', icon: 'fa-tshirt', sort_order: 2 },
      { name: 'home', display_name: 'Home & Garden', icon: 'fa-home', sort_order: 3 }
    ]});
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

module.exports = router;
