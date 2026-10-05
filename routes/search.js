const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const { getDb } = require('../models/database');

router.get('/', async (req, res) => {
  try {
    var q = req.query.q;
    var category = req.query.category;
    var minPrice = req.query.minPrice;
    var maxPrice = req.query.maxPrice;
    var limit = req.query.limit;
    var country = req.query.country;
    var sort = req.query.sort;

    if (!q || typeof q !== 'string' || q.trim().length === 0 || q.length > 200) {
      return res.status(400).json({ error: 'Query parameter "q" is required (max 200 chars)' });
    }

    q = q.trim().replace(/[<>\"\']/g, '');

    var options = {
      category: (category && /^[a-z]{3,20}$/.test(category)) ? category : undefined,
      minPrice: (minPrice && !isNaN(minPrice) && minPrice >= 0 && minPrice <= 1000000) ? parseFloat(minPrice) : undefined,
      maxPrice: (maxPrice && !isNaN(maxPrice) && maxPrice >= 0 && maxPrice <= 1000000) ? parseFloat(maxPrice) : undefined,
      limit: (limit && !isNaN(limit) && limit > 0 && limit <= 100) ? parseInt(limit) : 50,
      country: (country && /^[A-Za-z]{2}$/.test(country)) ? country.toUpperCase() : 'US',
      sort: ['price_asc', 'price_desc', 'rating'].includes(sort) ? sort : 'price_asc'
    };

    const results = await searchService.searchAll(q.trim(), options);

    try {
      const db = getDb();
      if (db) {
        await db.collection('search_logs').insertOne({
          query: q.trim(),
          category: options.category,
          filters: { minPrice: options.minPrice, maxPrice: options.maxPrice },
          results_count: results.length,
          user_id: req.user?._id || null,
          ip_address: req.ip,
          searched_at: new Date()
        });
      }
    } catch (e) {}

    const hasRealData = searchService.hasRealKeys;

    res.json({
      query: q.trim(),
      results_count: results.length,
      has_real_data: hasRealData,
      filters_applied: options,
      results: results,
      platforms_searched: searchService.getPlatformCount()
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const db = getDb();
    if (db) {
      const suggestions = await db.collection('search_logs')
        .find({ query: { $regex: q, $options: 'i' } })
        .limit(8)
        .toArray();
      const unique = [...new Set(suggestions.map(s => s.query))];
      return res.json({ suggestions: unique });
    }
    res.json({ suggestions: [] });
  } catch (err) {
    res.json({ suggestions: [] });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const db = getDb();
    if (db) {
      const popular = await db.collection('search_logs')
        .aggregate([
          { $group: { _id: '$query', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
        .toArray();
      return res.json({ popular: popular.map(p => ({ query: p._id, count: p.count })) });
    }
    res.json({ popular: [] });
  } catch (err) {
    res.json({ popular: [] });
  }
});

module.exports = router;
