const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

router.get('/', async (req, res) => {
  try {
    const { q, sources } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    let results = await searchService.searchAll(q, { limit: 100 });

    if (sources) {
      const sourceList = sources.split(',');
      results = results.filter(r => sourceList.includes(r.source));
    }

    if (results.length === 0) {
      return res.json({ query: q, results: [], message: 'No results found' });
    }

    const bySource = {};
    results.forEach(r => {
      if (!bySource[r.source]) bySource[r.source] = [];
      bySource[r.source].push(r);
    });

    const cheapestBySource = Object.entries(bySource).map(([source, items]) => {
      const cheapest = items.sort((a, b) => a.price - b.price)[0];
      return { source, product: cheapest, count: items.length };
    }).sort((a, b) => a.product.price - b.product.price);

    const globalCheapest = cheapestBySource[0]?.product;
    const globalExpensive = [...results].sort((a, b) => b.price - a.price)[0];
    const avgPrice = results.reduce((s, r) => s + r.price, 0) / results.length;
    const totalSavings = globalExpensive ? (globalExpensive.price - globalCheapest.price) : 0;

    res.json({
      query: q,
      summary: {
        results_count: results.length,
        sources_count: cheapestBySource.length,
        cheapest_price: globalCheapest?.price || 0,
        most_expensive_price: globalExpensive?.price || 0,
        average_price: Math.round(avgPrice * 100) / 100,
        potential_savings: Math.round(totalSavings * 100) / 100,
        savings_percent: globalExpensive ? Math.round((totalSavings / globalExpensive.price) * 100) : 0
      },
      cheapest_by_source: cheapestBySource,
      all_results: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Comparison failed', message: err.message });
  }
});

module.exports = router;
