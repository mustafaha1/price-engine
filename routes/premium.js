const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const { requireAuth } = require('../middleware/auth');

const PLANS = {
  free: { name: 'Free', price: 0, searches: 10, alerts: 3, features: ['10 searches/day', '3 price alerts', 'Basic comparison'] },
  basic: { name: 'Basic', price: 9, searches: 100, alerts: 10, stripe_price: process.env.STRIPE_PRICE_BASIC, features: ['100 searches/day', '10 price alerts', 'Advanced filters', 'Price history'] },
  pro: { name: 'Pro', price: 29, searches: 999999, alerts: 999999, stripe_price: process.env.STRIPE_PRICE_PRO, features: ['Unlimited searches', 'Unlimited alerts', 'API access', 'Photo search', 'Priority support'] },
  enterprise: { name: 'Enterprise', price: 99, searches: 999999, alerts: 999999, stripe_price: process.env.STRIPE_PRICE_ENTERPRISE, features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'Analytics dashboard'] }
};

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan] || plan === 'free') return res.status(400).json({ error: 'Invalid plan' });
    const session = await stripeService.createCheckoutSession(req.user, plan);
    res.json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed', message: err.message });
  }
});

router.get('/success', async (req, res) => {
  res.redirect('/premium.html?status=success');
});

router.get('/cancel', async (req, res) => {
  res.redirect('/premium.html?status=cancel');
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    await stripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const plan = req.user.plan || 'free';
    res.json({ plan, plan_name: PLANS[plan]?.name || 'Free', searches_limit: req.user.searches_limit || 10, alerts_limit: req.user.alerts_limit || 3, is_premium: plan !== 'free' });
  } catch (err) {
    res.json({ plan: 'free', plan_name: 'Free', searches_limit: 10, alerts_limit: 3, is_premium: false });
  }
});

module.exports = router;
