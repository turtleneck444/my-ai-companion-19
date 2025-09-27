// Netlify function for Stripe payment processing
import Stripe from 'stripe';

// Check if payments are enabled
const PAYMENT_PROVIDER = 'stripe';
const PAYMENTS_ENABLED = true;

// Initialize payment processor only if enabled
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

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

export async function handler(event) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check if payments are disabled
  if (!PAYMENTS_ENABLED) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        error: 'Payments are currently disabled',
        provider: PAYMENT_PROVIDER,
        message: 'Payment processing is not configured' 
      })
    };
  }

    }
  }

  try {
    const { httpMethod, path, body } = event;
    const data = body ? JSON.parse(body) : {};

    // Route handling
    if (path.endsWith('/create-intent')) {
      return await handleCreateIntent(data, headers);
    } else if (path.endsWith('/confirm')) {
      return await handleConfirmPayment(data, headers);
    } else if (path.endsWith('/create-subscription')) {
      return await handleCreateSubscription(data, headers);
    } else if (path.endsWith('/cancel-subscription')) {
      return await handleCancelSubscription(data, headers);
    } else if (path.endsWith('/webhook')) {
      return await handleWebhook(event, headers);
    } else if (path.includes('/subscription/')) {
      return await handleGetSubscription(path, headers);
    } else if (path.includes('/customer/') && path.includes('/subscriptions')) {
      return await handleGetCustomerSubscriptions(path, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Payment function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
}

async function handleCreateIntent(data, headers) {
  const { planId, userId, amount, currency = 'usd', provider = PAYMENT_PROVIDER, sourceId } = data;

  console.log('💳 Payment request:', {
    planId,
    amount,
    currency,
    provider,
    hasSourceId: !!sourceId
  });

  try {
    if (provider === 'stripe') {
      if (!stripe || !process.env.STRIPE_SECRET_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe not configured' }) };
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { planId, userId: userId || 'anonymous' },
        automatic_payment_methods: { enabled: true },
      });
      return { statusCode: 200, headers, body: JSON.stringify({ id: paymentIntent.id, clientSecret: paymentIntent.client_secret, status: paymentIntent.status }) };
    }

