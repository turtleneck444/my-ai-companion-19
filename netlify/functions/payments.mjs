import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['5 messages per day', '1 voice call per day', 'Basic features'],
    limits: { messages: 5, voice_calls: 1 }
  },
  premium: {
    name: 'Premium',
    price: 1900, // $19.00 in cents
    features: ['50 messages per day', '5 voice calls per day', 'Advanced features', 'Priority support'],
    limits: { messages: 50, voice_calls: 5 }
  },
  pro: {
    name: 'Pro',
    price: 4900, // $49.00 in cents
    features: ['Unlimited messages', 'Unlimited voice calls', 'All features', 'API access'],
    limits: { messages: -1, voice_calls: -1 }
  }
};

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' }),
    };
  }

  try {
    const { method, plan, paymentMethodId, customerId } = JSON.parse(event.body || '{}');

    if (method === 'createPaymentIntent') {
      if (!plan || !SUBSCRIPTION_PLANS[plan]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid plan' }),
        };
      }

      const planData = SUBSCRIPTION_PLANS[plan];
      
      if (plan === 'free') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            message: 'Free plan activated',
            plan: planData
          }),
        };
      }

      // Create payment intent for paid plans
      const paymentIntent = await stripe.paymentIntents.create({
        amount: planData.price,
        currency: 'usd',
        metadata: {
          plan: plan,
          planName: planData.name
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          clientSecret: paymentIntent.client_secret,
          plan: planData
        }),
      };
    }

    if (method === 'createSubscription') {
      if (!plan || !SUBSCRIPTION_PLANS[plan] || plan === 'free') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid plan for subscription' }),
        };
      }

      const planData = SUBSCRIPTION_PLANS[plan];
      
      // Create a price for the plan
      const price = await stripe.prices.create({
        unit_amount: planData.price,
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: `${planData.name} Plan`,
          description: planData.features.join(', '),
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          plan: planData
        }),
      };
    }

    if (method === 'getPlans') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          plans: SUBSCRIPTION_PLANS
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid method' }),
    };

  } catch (error) {
    console.error('Payment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Payment processing failed',
        details: error.message 
      }),
    };
  }
};
