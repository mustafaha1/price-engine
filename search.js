const express = require('express');
const { getDb } = require('./database');
const { authenticateToken } = require('./auth');
const searchService = require('./searchService');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    var q = req.query.q;
    var category = req.query.category;
    var minPrice = req.query.minPrice;
    var maxPrice = req.query.maxPrice;
    var limit = req.query.limit;
    var country = req.query.country;
    var sort = req.query.sort;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
    }

    q = q.trim().replace(/[<>"'\/]/g, '');
    if (!q || q.length < 1) {
      return res.status(400).json({ success: false, message: 'Search query cannot be empty' });
    }
    if (q.length > 100) {
      q = q.substring(0, 100);
    }

    var options = {
      category: (category && /^[a-z]{3,20}$/.test(category)) ? category : undefined,
      minPrice: (minPrice && !isNaN(minPrice) && minPrice >= 0 && minPrice <= 1000000) ? parseFloat(minPrice) : undefined,
      maxPrice: (maxPrice && !isNaN(maxPrice) && maxPrice >= 0 && maxPrice <= 1000000) ? parseFloat(maxPrice) : undefined,
      limit: (limit && !isNaN(limit) && limit > 0 && limit <= 100) ? parseInt(limit) : 50,
      country: (country && /^[A-Za-z]{2}$/.test(country)) ? country.toUpperCase() : 'US',
      sort: ['price_asc', 'price_desc', 'rating'].includes(sort) ? sort : 'price_asc'
    };

    var results = await searchService.search(q, options);

    res.json({
      success: true,
      query: q,
      count: results.length,
      results: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

router.get('/by-image', async (req, res) => {
  try {
    var imageUrl = req.query.imageUrl;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    if (!imageUrl.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Invalid image URL' });
    }

    var country = req.query.country;
    var sort = req.query.sort;
    var limit = req.query.limit;

    var options = {
      country: (country && /^[A-Za-z]{2}$/.test(country)) ? country.toUpperCase() : 'US',
      sort: ['price_asc', 'price_desc', 'rating'].includes(sort) ? sort : 'price_asc',
      limit: (limit && !isNaN(limit) && limit > 0 && limit <= 100) ? parseInt(limit) : 50
    };

    var result = await searchService.searchByImage(imageUrl, options);

    if (!result.recognized) {
      return res.json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      query: result.query,
      count: result.results.length,
      results: result.results
    });
  } catch (error) {
    console.error('Search by image error:', error);
    res.status(500).json({ success: false, message: 'Image search failed' });
  }
});

router.post('/history', authenticateToken, (req, res) => {
  try {
    var query = req.body.query;
    var resultsCount = req.body.resultsCount || 0;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    var db = getDb();
    db.run(
      'INSERT INTO search_history (user_id, query, results_count) VALUES (?, ?, ?)',
      [req.userId, query.substring(0, 200), resultsCount],
      function(err) {
        if (err) {
          console.error('History save error:', err);
          return res.status(500).json({ success: false, message: 'Failed to save history' });
        }
        res.json({ success: true, message: 'History saved' });
      }
    );
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, message: 'Failed to save history' });
  }
});

module.exports = router;
