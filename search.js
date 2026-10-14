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
      limit: (limit && !isNaN(limit) && limit > 0 && limit <= 100) ? parseInt(limit) : 60,
      country: (country && /^[A-Za-z]{2}$/.test(country)) ? country.toUpperCase() : 'US',
      sort: ['relevance', 'price_asc', 'price_desc', 'rating'].includes(sort) ? sort : 'relevance'
    };

    var results = await searchService.search(q, options);

    // Fix: Map Amazon/eBay to UK domains for UK users
    if (options.country === 'UK') {
      results.forEach(function(product) {
        if (product.product_url) {
          if (product.product_url.includes('amazon.com') && !product.product_url.includes('amazon.co.uk')) {
            product.product_url = product.product_url.replace('amazon.com', 'amazon.co.uk');
          }
          if (product.product_url.includes('ebay.com') && !product.product_url.includes('ebay.co.uk')) {
            product.product_url = product.product_url.replace('ebay.com', 'ebay.co.uk');
          }
        }
      });
    }

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

module.exports = router;
