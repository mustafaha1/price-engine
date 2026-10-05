const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDb } = require('../models/database');

class StripeService {
  async createCheckoutSession(user, plan) {
    const prices = {
      basic: process.env.STRIPE_PRICE_BASIC,
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE
    };

    const priceId = prices[plan];
    if (!priceId) throw new Error('Invalid plan');

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/premium.html?status=success`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/premium.html?status=cancel`,
      metadata: { userId: user._id.toString(), plan }
    });

    return session;
  }

  async handleWebhook(event) {
    const db = getDb();
    if (!db) return;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;

        const limits = {
          basic: { searches_limit: 100, alerts_limit: 10 },
          pro: { searches_limit: 999999, alerts_limit: 999999 },
          enterprise: { searches_limit: 999999, alerts_limit: 999999 }
        };

        await db.collection('users').updateOne(
          { _id: require('mongodb').ObjectId.createFromHexString(userId) },
          {
            $set: {
              plan,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              ...limits[plan]
            }
          }
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await db.collection('users').updateOne(
          { stripe_subscription_id: subscription.id },
          { $set: { plan: 'free', searches_limit: 10, alerts_limit: 3 } }
        );
        break;
      }
    }
  }
}

module.exports = new StripeService();
