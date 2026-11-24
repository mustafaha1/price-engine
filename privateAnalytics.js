// Anonymous aggregate counters. No IP, cookies, user agents or visitor identifiers stored.
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./database');
const dashboardRouter = express.Router();
const analyticsLoginLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many dashboard requests. Please try again later.'
});
let lastCleanupDay = '';
function purgeOldRecords(db) {
  const today = new Date().toISOString().slice(0, 10);
  if (today === lastCleanupDay) return;
  db.run("DELETE FROM private_analytics WHERE event = 'search_term' AND day < date('now','-29 days')",
    err => {
      if (err) console.error('Analytics retention cleanup error:', err.message);
      else lastCleanupDay = today;
    });
}
function safeSearchTerm(value) {
  const term = String(value).trim().slice(0, 100);
  // Avoid retaining obvious contact details or identifiers in search terms.
  if (/@|https?:|www\.|\b\d{7,}\b|\+\d[\d\s()-]{7,}/i.test(term)) return '[redacted search]';
  return term.replace(/[\x00-\x1f]/g, '');
}

function initAnalytics() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(`CREATE TABLE IF NOT EXISTS private_analytics (
      day TEXT NOT NULL, event TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(day,event,detail)
    )`, err => {
      if (err) return reject(err);
      db.run("DELETE FROM private_analytics WHERE event = 'search_term' AND day < date('now','-29 days')",
        cleanupError => {
          if (cleanupError) return reject(cleanupError);
          lastCleanupDay = new Date().toISOString().slice(0, 10);
          db.run(`CREATE TABLE IF NOT EXISTS private_visitors (day TEXT NOT NULL, visitor TEXT NOT NULL, PRIMARY KEY(day,visitor))`, e => e ? reject(e) : resolve());
        });
    });
  });
}
function count(event, detail = '') {
  if (!['page_view','search','store_click'].includes(event)) return;
  // Limit text and avoid logging free-form data. Search terms may still contain personal data.
  detail = event === 'store_click' ? String(detail).slice(0,100).replace(/[^a-z0-9.-]/gi,'') : ''; 
  const db = getDb();
  if (!db) return;
  purgeOldRecords(db);
  db.run(`INSERT INTO private_analytics (day,event,detail,count)
    VALUES (date('now'),?,?,1)
    ON CONFLICT(day,event,detail) DO UPDATE SET count=count+1`,
    [event, detail], err => { if (err) console.error('Analytics counter error:', err.message); });
  if (event === 'search') {
    const term = safeSearchTerm(arguments[1]);
    db.run(`INSERT INTO private_analytics (day,event,detail,count)
      VALUES (date('now'),'search_term',?,1)
      ON CONFLICT(day,event,detail) DO UPDATE SET count=count+1`,
      [term], err => { if (err) console.error('Analytics search term error:',err.message); });
  }
}
function authorized(req, res, next) {
  const password = process.env.ANALYTICS_PASSWORD;
  if (!password || password.length < 16) return res.status(503).send('Dashboard not configured');
  const header = req.get('authorization') || '';
  const token = header.startsWith('Basic ') ? header.slice(6) : '';
  let provided = '';
  try {
    const pair = Buffer.from(token, 'base64').toString('utf8');
    if (pair.includes(':')) provided = pair.slice(pair.indexOf(':') + 1);
  } catch (_) {}
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(password).digest();
  if (!crypto.timingSafeEqual(a,b)) {
    res.set('WWW-Authenticate','Basic realm="PriceEngine private analytics"');
    return res.status(401).send('Authentication required');
  }
  next();
}
dashboardRouter.use(analyticsLoginLimiter);
dashboardRouter.use(authorized);
dashboardRouter.use((req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Robots-Tag','noindex, nofollow');next();});
dashboardRouter.get('/', (req,res)=>{
  res.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
  res.type('html').send(fs.readFileSync(path.join(__dirname,'private-analytics-dashboard.html'),'utf8'));
});
dashboardRouter.get('/data', (req,res)=>{
  const db=getDb();
  db.all(`SELECT day,event,detail,count FROM private_analytics
    WHERE event != 'search_term' OR day >= date('now','-29 days')
    ORDER BY day DESC, count DESC`,[],(err,rows)=>{
      if(err) return res.status(500).json({error:'Unable to read analytics'});
      db.all(`SELECT COUNT(DISTINCT CASE WHEN day=date('now') THEN visitor END) AS today,
        COUNT(DISTINCT CASE WHEN day>=date('now','-6 days') THEN visitor END) AS week,
        COUNT(DISTINCT visitor) AS month FROM private_visitors WHERE day>=date('now','-29 days')`,[],(e,v)=>{
          if(e) return res.status(500).json({error:'Unable to read visitor counts'});
          res.json({days:30,rows,visitors:v[0],visitorEnabled:visitorEnabled()});
        });
    });
});
// Explicit staging-only opt-in. No visitor identifier without consent.
const visitorEnabled = () => process.env.PRIVATE_VISITOR_MODE === 'staging-test';
function visitorEvent(req,res) {
  res.set('Cache-Control','no-store');
  if (!visitorEnabled()) return res.sendStatus(404);
  if (req.get('sec-fetch-site') !== 'same-origin' || !req.is('application/json')) return res.sendStatus(403);
  const {id, action} = req.body || {};
  if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) return res.sendStatus(400);
  const db = getDb();
  const hash = crypto.createHash('sha256').update(id).digest('hex');
  if (action === 'withdraw') return db.run('DELETE FROM private_visitors WHERE visitor=?',[hash],e=>res.sendStatus(e?500:204));
  if (action !== 'visit') return res.sendStatus(400);
  db.run("DELETE FROM private_visitors WHERE day < date('now','-29 days')",e=>{
    if(e) return res.sendStatus(500);
    db.run("INSERT OR IGNORE INTO private_visitors(day,visitor) VALUES(date('now'),?)",[hash],e=>res.sendStatus(e?500:204));
  });
}
module.exports={initAnalytics,count,dashboardRouter,visitorEnabled,visitorEvent};
