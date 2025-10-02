// Payment processing API endpoints with Stripe integration
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Payment provider configurations
const PAYMENT_CONFIG = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
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
    
    if (provider !== 'stripe') {
      return res.status(400).json({ error: 'Only Stripe is supported' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        planId,
        userId: userId || 'anonymous'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

// Confirm payment
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId, provider = 'stripe' } = req.body;
    
    if (provider !== 'stripe') {
      return res.status(400).json({ error: 'Only Stripe is supported' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    res.status(500).json({ error: 'Failed to confirm payment', details: error.message });
  }
});

// Create subscription
router.post('/create-subscription', async (req, res) => {
  try {
    const { planId, userId, paymentMethodId, customerId, provider = 'stripe' } = req.body;
    
    if (provider !== 'stripe') {
      return res.status(400).json({ error: 'Only Stripe is supported' });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    let customer;
    
    // Create or retrieve customer
    if (customerId) {
      customer = await stripe.customers.retrieve(customerId);
    } else {
      customer = await stripe.customers.create({
        metadata: {
          userId: userId || 'anonymous'
        }
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: plan.priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        planId,
        userId: userId || 'anonymous'
      }
    });

    res.json({
      id: subscription.id,
      status: subscription.status,
      customerId: customer.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('Subscription creation failed:', error);
    res.status(500).json({ error: 'Failed to create subscription', details: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, provider = 'stripe' } = req.body;
    
    if (provider !== 'stripe') {
      return res.status(400).json({ error: 'Only Stripe is supported' });
    }

    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    
    res.json({
      id: subscription.id,
      status: subscription.status,
      canceledAt: new Date(subscription.canceled_at * 1000).toISOString()
    });
  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
});

// Get subscription details
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    res.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId: subscription.metadata.planId
    });
  } catch (error) {
    console.error('Failed to retrieve subscription:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription', details: error.message });
  }
});

// Get customer subscriptions
router.get('/customer/:customerId/subscriptions', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all'
    });
    
    res.json(subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      planId: sub.metadata.planId
    })));
  } catch (error) {
    console.error('Failed to retrieve customer subscriptions:', error);
    res.status(500).json({ error: 'Failed to retrieve subscriptions', details: error.message });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Update user's plan in your database here
        break;
        
      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object;
        console.log('Subscription created:', subscriptionCreated.id);
        // Update user's subscription status in your database here
        break;
        
      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object;
        console.log('Subscription updated:', subscriptionUpdated.id);
        // Update user's subscription status in your database here
        break;
        
      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object;
        console.log('Subscription canceled:', subscriptionDeleted.id);
        // Update user's subscription status in your database here
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        // Handle successful recurring payment
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        // Handle failed payment - maybe send email notification
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
// ESM interop for server/index.js default import
exports.default = router;
