// Netlify function for payment processing with multiple providers
import Stripe from 'stripe';

// Check if payments are enabled
const PAYMENT_PROVIDER = process.env.VITE_PAYMENT_PROVIDER || 'none';
const PAYMENTS_ENABLED = PAYMENT_PROVIDER !== 'none' && PAYMENT_PROVIDER !== 'disabled';

// Initialize payment processor only if enabled
let stripe = null;
if (PAYMENTS_ENABLED && PAYMENT_PROVIDER === 'stripe' && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Initialize Square client if enabled
let square = null;
if (PAYMENTS_ENABLED && PAYMENT_PROVIDER === 'square' && process.env.SQUARE_ACCESS_TOKEN) {
  try {
    const { Client: SquareClient, Environment: SquareEnv } = await import('square');
    const env = (process.env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
      ? SquareEnv.Production
      : SquareEnv.Sandbox;
    square = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: env,
    });
    console.log('✅ Square client initialized successfully');
  } catch (error) {
    console.error('Square SDK load failed, continuing without Square:', error.message);
  }
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

    if (provider === 'square') {
      if (!square || !process.env.SQUARE_LOCATION_ID) {
        console.log('❌ Square not properly configured');
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Square not configured' }) };
      }
      if (!sourceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sourceId (card token)' }) };
      }
      const idempotencyKey = `${userId || 'anonymous'}-${planId}-${Date.now()}`;
      const { paymentsApi } = square;
      const payment = await paymentsApi.createPayment({
        sourceId,
        idempotencyKey,
        amountMoney: { amount: Math.round(amount * 100), currency: currency.toUpperCase() },
        locationId: process.env.SQUARE_LOCATION_ID,
        note: `LoveAI ${planId} plan`,
        referenceId: `${planId}-${userId || 'anonymous'}`,
      });

      const sq = payment?.result?.payment;
      if (!sq) throw new Error('Square payment failed');

      // Mark user active in Supabase on success
      if (['COMPLETED', 'APPROVED'].includes((sq.status || '').toUpperCase())) {
        await activateSupabaseUser(userId, planId);
      }

      return { statusCode: 200, headers, body: JSON.stringify({ id: sq.id, status: sq.status }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: `Unsupported provider: ${provider}` }) };
  } catch (error) {
    console.error('Payment processing error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create payment', details: String(error?.message || error) }) };
  }
}

async function handleConfirmPayment(data, headers) {
  const { paymentIntentId } = data;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to confirm payment', details: error.message })
    };
  }
}

async function handleCreateSubscription(data, headers) {
  const { planId, userId, paymentMethodId, customerId } = data;

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid plan ID' })
    };
  }

  try {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: subscription.id,
        status: subscription.status,
        customerId: customer.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create subscription', details: error.message })
    };
  }
}

async function handleCancelSubscription(data, headers) {
  const { subscriptionId } = data;

  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: subscription.id,
        status: subscription.status,
        canceledAt: new Date(subscription.canceled_at * 1000).toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to cancel subscription', details: error.message })
    };
  }
}

async function handleGetSubscription(path, headers) {
  const subscriptionId = path.split('/').pop();

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        planId: subscription.metadata.planId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve subscription', details: error.message })
    };
  }
}

async function handleGetCustomerSubscriptions(path, headers) {
  const customerId = path.split('/')[2];

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all'
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        planId: sub.metadata.planId
      })))
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve subscriptions', details: error.message })
    };
  }
}

async function handleWebhook(event, headers) {
  // Check if payment processor is available
  if (!PAYMENTS_ENABLED) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Webhook received but payments are disabled',
        provider: PAYMENT_PROVIDER,
        received: true 
      })
    };
  }

  // Handle Square webhooks
  if (PAYMENT_PROVIDER === 'square') {
    return await handleSquareWebhook(event, headers);
  }

  // Handle Stripe webhooks
  if (PAYMENT_PROVIDER === 'stripe') {
    const sig = event.headers['stripe-signature'];
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
      };
    }

    return await handleStripeWebhookEvents(stripeEvent, headers);
  }

  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ error: `Unsupported payment provider: ${PAYMENT_PROVIDER}` })
  };
}

// Handle Square webhook events
async function handleSquareWebhook(event, headers) {
  try {
    const webhookBody = event.body;
    const webhookSignature = event.headers['x-square-signature'];
    
    // For now, just log the webhook and return success
    // TODO: Add Square webhook signature verification when Square credentials are configured
    console.log('Square webhook received:', {
      signature: webhookSignature ? 'present' : 'missing',
      bodyLength: webhookBody ? webhookBody.length : 0
    });

    const data = webhookBody ? JSON.parse(webhookBody) : {};
    console.log('Square webhook event type:', data.type);

    // Handle different Square webhook events
    switch (data.type) {
      case 'payment.created':
      case 'payment.updated':
        console.log('Payment event received:', data.data?.id);
        break;
      case 'invoice.payment_made':
        console.log('Invoice payment made:', data.data?.id);
        break;
      default:
        console.log('Unhandled webhook event type:', data.type);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Square webhook processed successfully',
        eventType: data.type,
        received: true 
      })
    };
  } catch (error) {
    console.error('Square webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed', details: error.message })
    };
  }
}

// Handle Stripe webhook events
async function handleStripeWebhookEvents(stripeEvent, headers) {
  try {
    console.log('Stripe webhook received:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = stripeEvent.data.object;
        console.log('Subscription event:', subscription.id);
        // Handle subscription events
        break;
      default:
        console.log('Unhandled Stripe event type:', stripeEvent.type);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Stripe webhook processed successfully',
        eventType: stripeEvent.type,
        received: true 
      })
    };
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed', details: error.message })
    };
  }
}

// Activate Supabase user after successful payment
async function activateSupabaseUser(userId, planId) {
  try {
    if (!userId) return;
    const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        subscription_status: 'active',
        plan: planId,
        subscription_plan_id: planId,
        updated_at: new Date().toISOString()
      })
    });
    if (!res.ok) {
      const t = await res.text();
      console.warn('Supabase profile activation failed:', t);
    }
  } catch (e) {
    console.warn('activateSupabaseUser error:', e);
  }
}
