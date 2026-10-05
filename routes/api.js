const express = require('express');
const router = express.Router();
const { requireAuth, requirePlan } = require('../middleware/auth');
const searchService = require('../services/searchService');

router.get('/search', requireAuth, requirePlan(['pro', 'enterprise']), async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const results = await searchService.searchAll(q, { limit: parseInt(limit) });
    res.json({ query: q, results_count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: 'API search failed', message: err.message });
  }
});

module.exports = router;
