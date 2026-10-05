const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    let dbStatus = 'disconnected';
    if (db) {
      try { await db.admin().ping(); dbStatus = 'connected'; } catch (e) { dbStatus = 'error'; }
    }
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), database: { status: dbStatus } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
