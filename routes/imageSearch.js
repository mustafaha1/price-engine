const express = require('express');
const router = express.Router();
const multer = require('multer');
const searchService = require('../services/searchService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const searchQuery = 'electronics popular products';
    const results = await searchService.searchAll(searchQuery, { limit: 20 });
    res.json({ detected_category: 'electronics', search_query: searchQuery, results_count: results.length, results, demo: true });
  } catch (err) {
    res.status(500).json({ error: 'Image search failed', message: err.message });
  }
});

module.exports = router;
