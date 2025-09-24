// Netlify function for payment processing with Stripe
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  const { planId, userId, amount, currency = 'usd' } = data;

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Stripe not configured' })
    };
  }

  try {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create payment intent', details: error.message })
    };
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

  try {
    // Handle the event
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Update user's plan in your database here
        break;
        
      case 'customer.subscription.created':
        const subscriptionCreated = stripeEvent.data.object;
        console.log('Subscription created:', subscriptionCreated.id);
        // Update user's subscription status in your database here
        break;
        
      case 'customer.subscription.updated':
        const subscriptionUpdated = stripeEvent.data.object;
        console.log('Subscription updated:', subscriptionUpdated.id);
        // Update user's subscription status in your database here
        break;
        
      case 'customer.subscription.deleted':
        const subscriptionDeleted = stripeEvent.data.object;
        console.log('Subscription canceled:', subscriptionDeleted.id);
        // Update user's subscription status in your database here
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = stripeEvent.data.object;
        console.log('Invoice payment succeeded:', invoice.id);
        // Handle successful recurring payment
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = stripeEvent.data.object;
        console.log('Invoice payment failed:', failedInvoice.id);
        // Handle failed payment - maybe send email notification
        break;
        
      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
}
