const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');
const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);

// Get user's favorites
router.get('/', (req, res) => {
  var db = getDb();
  db.all(
    'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, rows) => {
      if (err) {
        console.error('Favorites error:', err);
        return res.status(500).json({ success: false, message: 'Failed to load favorites' });
      }
      res.json({ success: true, favorites: rows });
    }
  );
});

// Add favorite
router.post('/', (req, res) => {
  try {
    var title = req.body.product_title || req.body.title;
    var url = req.body.product_url || req.body.url;
    var image = req.body.product_image || req.body.image;
    var price = req.body.product_price || req.body.price;
    var source = req.body.product_source || req.body.source;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Product title is required' });
    }

    var db = getDb();
    db.run(
      'INSERT INTO favorites (user_id, product_title, product_url, product_image, product_price, product_source) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, title.substring(0, 500), url ? url.substring(0, 1000) : null, image ? image.substring(0, 1000) : null, price || null, source ? source.substring(0, 100) : null],
      function(err) {
        if (err) {
          console.error('Add favorite error:', err);
          return res.status(500).json({ success: false, message: 'Failed to add favorite' });
        }
        res.status(201).json({ success: true, message: 'Added to favorites', id: this.lastID });
      }
    );
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to add favorite' });
  }
});

// Remove favorite
router.delete('/:id', (req, res) => {
  var db = getDb();
  db.run(
    'DELETE FROM favorites WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId],
    function(err) {
      if (err) {
        console.error('Delete favorite error:', err);
        return res.status(500).json({ success: false, message: 'Failed to remove favorite' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Favorite not found' });
      }
      res.json({ success: true, message: 'Favorite removed' });
    }
  );
});

module.exports = router;
