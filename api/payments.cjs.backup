// Real Payment processing API endpoints with Square and Stripe integration
const express = require('express');
// Make Stripe optional (only used when provider==='stripe')
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn('Stripe SDK load failed, continuing without Stripe:', e?.message);
  }
}
const { Client, Environment } = require('squareup');
const router = express.Router();

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox
});

// Payment provider configurations
const PAYMENT_CONFIG = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  },
  square: {
    applicationId: process.env.SQUARE_APPLICATION_ID,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    locationId: process.env.SQUARE_LOCATION_ID
  }
};

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
    amount: 1900, // $19.00 in cents
    currency: 'usd',
    interval: 'month'
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly', 
    amount: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month'
  }
};

// Create payment intent for one-time payments
router.post('/create-intent', async (req, res) => {
  try {
    const { planId, userId, amount, currency = 'usd', provider = 'stripe' } = req.body;
    
    if (provider === 'stripe') {
      if (!stripe || !process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { planId, userId: userId || 'anonymous' },
        automatic_payment_methods: { enabled: true },
      });

      return res.json({ id: paymentIntent.id, clientSecret: paymentIntent.client_secret, status: paymentIntent.status });
    }

    if (provider === 'square') {
      if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      const { sourceId } = req.body || {};
      if (!sourceId || typeof sourceId !== 'string') {
        return res.status(400).json({ error: 'Missing sourceId from Square card tokenization' });
      }

      const { paymentsApi } = squareClient;
      const payment = await paymentsApi.createPayment({
        sourceId,
        amountMoney: { amount: Math.round(amount * 100), currency: currency.toUpperCase() },
        locationId: process.env.SQUARE_LOCATION_ID,
        referenceId: `${planId}-${userId || 'anonymous'}-${Date.now()}`,
        note: `Payment for ${planId} plan`
      });

      if (payment.result && payment.result.payment) {
        return res.json({ id: payment.result.payment.id, status: payment.result.payment.status, referenceId: payment.result.payment.referenceId });
      }

      throw new Error('Failed to create Square payment');
    }

    return res.status(400).json({ error: `Payment provider '${provider}' is not supported` });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

module.exports = router; 