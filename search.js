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

router.post('/track-view', async (req, res) => {
  try {
    var productId = req.body.productId;
    var productTitle = req.body.productTitle;
    var productUrl = req.body.productUrl;
    var productSource = req.body.productSource;

    if (!productUrl) {
      return res.status(400).json({ success: false, message: 'productUrl is required' });
    }

    var db = getDb();
    db.get('SELECT id, view_count FROM product_views WHERE product_url = ?', [productUrl], function(err, row) {
      if (err) {
        console.error('View tracking error:', err);
        return res.status(500).json({ success: false, message: 'Failed to track view' });
      }

      if (row) {
        db.run(
          'UPDATE product_views SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP WHERE id = ?',
          [row.id],
          function(err) {
            if (err) console.error('View update error:', err);
          }
        );
        res.json({ success: true, viewCount: row.view_count + 1 });
      } else {
        db.run(
          'INSERT INTO product_views (product_id, product_title, product_url, product_source, view_count) VALUES (?, ?, ?, ?, 1)',
          [productId, productTitle, productUrl, productSource],
          function(err) {
            if (err) console.error('View insert error:', err);
          }
        );
        res.json({ success: true, viewCount: 1 });
      }
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, message: 'Failed to track view' });
  }
});

router.get('/views', async (req, res) => {
  try {
    var productUrls = req.query.urls;
    if (!productUrls) {
      return res.json({ success: true, views: {} });
    }

    var urls = productUrls.split(',');
    var placeholders = urls.map(() => '?').join(',');
    var db = getDb();

    db.all('SELECT product_url, view_count FROM product_views WHERE product_url IN (' + placeholders + ')', urls, function(err, rows) {
      if (err) {
        console.error('Get views error:', err);
        return res.status(500).json({ success: false, message: 'Failed to get views' });
      }

      var views = {};
      for (var i = 0; i < rows.length; i++) {
        views[rows[i].product_url] = rows[i].view_count;
      }
      res.json({ success: true, views: views });
    });
  } catch (error) {
    console.error('Get views error:', error);
    res.status(500).json({ success: false, message: 'Failed to get views' });
  }
});

router.post('/price-alert', async (req, res) => {
  try {
    var email = req.body.email;
    var productUrl = req.body.productUrl;
    var productTitle = req.body.productTitle;
    var targetPrice = req.body.targetPrice;

    if (!email || !targetPrice) {
      return res.status(400).json({ success: false, message: 'Email and target price are required' });
    }

    var db = getDb();
    db.run(
      'INSERT INTO price_alerts (email, product_url, product_title, target_price) VALUES (?, ?, ?, ?)',
      [email, productUrl || '', productTitle || '', targetPrice],
      function(err) {
        if (err) {
          console.error('Price alert error:', err);
          return res.status(500).json({ success: false, message: 'Failed to set alert' });
        }
        res.json({ success: true, message: 'Price alert set successfully' });
      }
    );
  } catch (error) {
    console.error('Price alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to set alert' });
  }
});

module.exports = router;
