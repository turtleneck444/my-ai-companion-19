// Netlify function for Stripe payment processing with advanced security
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
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1SBmcwFNMtIBKmjmouhnghrv',
    amount: 1900, // $19.00 in cents
    currency: 'usd',
    interval: 'month'
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_1SBmeXFNMtIBKmjmCNdli6HG', 
    amount: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month'
  }
};

// Security: Validate webhook signature
function validateWebhookSignature(payload, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('No webhook secret configured - skipping signature validation');
    return true;
  }
  
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    return event;
  } catch (err) {
    console.error('Webhook signature validation failed:', err.message);
    return false;
  }
}

// Security: Validate payment status
function isPaymentSuccessful(paymentIntent) {
  if (!paymentIntent) return false;
  
  // Only these statuses indicate successful payment
  const successStatuses = ['succeeded'];
  return successStatuses.includes(paymentIntent.status);
}

// Security: Validate subscription status
function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  
  // Only these statuses indicate active subscription
  const activeStatuses = ['active', 'trialing'];
  return activeStatuses.includes(subscription.status);
}

// Activate user in Supabase after successful payment
async function activateSupabaseUser(customerId, planId, paymentMethod = null) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      return false;
    }

    // Prepare payment method data for storage
    const paymentData = paymentMethod ? {
      payment_method_id: paymentMethod.id,
      card_brand: paymentMethod.card?.brand,
      card_last4: paymentMethod.card?.last4,
      card_exp_month: paymentMethod.card?.exp_month,
      card_exp_year: paymentMethod.card?.exp_year,
      payment_method_created: new Date(paymentMethod.created * 1000).toISOString(),
    } : {};

    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        subscription_plan: planId,
        subscription_status: 'active',
        subscription_customer_id: customerId,
        ...paymentData,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Failed to activate user in Supabase:', response.status, response.statusText);
      return false;
    }

    console.log('✅ User activated in Supabase with payment method:', customerId, planId, paymentData);
    return true;
  } catch (error) {
    console.error('Error activating user in Supabase:', error);
    return false;
  }
}

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
  const { planId, userId, amount, currency = 'usd', provider = PAYMENT_PROVIDER } = data;

  console.log('💳 Payment intent request:', {
    planId,
    amount,
    currency,
    provider,
    userId: userId || 'anonymous'
  });

  try {
    if (provider === 'stripe') {
      if (!stripe || !process.env.STRIPE_SECRET_KEY) {
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ error: 'Stripe not configured' }) 
        };
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        return { 
          statusCode: 400, 
          headers, 
          body: JSON.stringify({ error: 'Invalid plan ID' }) 
        };
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.amount,
        currency: currency.toLowerCase(),
        metadata: { 
          planId, 
          userId: userId || 'anonymous',
          timestamp: Date.now().toString()
        },
        automatic_payment_methods: { enabled: true },
        capture_method: 'automatic'
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
    }

    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: `Unsupported provider: ${provider}` }) 
    };

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Failed to create payment intent', details: error.message }) 
    };
  }
}

async function handleCreateSubscription(data, headers) {
  const { planId, paymentMethodId, customerEmail, customerName, customerAge } = data;
  
  console.log('💳 Subscription creation request:', {
    planId,
    customerEmail,
    hasPaymentMethod: !!paymentMethodId
  });

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: 'Invalid plan ID' }) 
    };
  }

  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Stripe not configured' }) 
    };
  }

  try {
    // Create or retrieve customer
    let customer;
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        payment_method: paymentMethodId,
        email: customerEmail,
        name: customerName,
        metadata: { age: customerAge, planId: planId },
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Attach payment method to customer if not already attached
    if (paymentMethodId && !customer.invoice_settings.default_payment_method) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create subscription with immediate payment
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.priceId }],
      expand: ['latest_invoice.payment_intent'],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      collection_method: 'charge_automatically'
    });

    const latestInvoice = subscription.latest_invoice;
    const paymentIntent = latestInvoice?.payment_intent;

    // Confirm the payment intent immediately
    if (paymentIntent && paymentIntent.status === 'requires_confirmation') {
      try {
        const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: paymentMethodId
        });
        
        if (isPaymentSuccessful(confirmedPaymentIntent)) {
          console.log('✅ Payment confirmed and successful, activating user:', customer.id, planId);
          
          // Get the payment method details for storage
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
          
          await activateSupabaseUser(customer.id, planId, paymentMethod);
        } else {
          console.log('❌ Payment confirmation failed:', {
            paymentIntentStatus: confirmedPaymentIntent.status,
            subscriptionStatus: subscription.status
          });
        }
      } catch (confirmError) {
        console.error('Payment confirmation error:', confirmError);
      }
    } else if (paymentIntent && isPaymentSuccessful(paymentIntent)) {
      console.log('✅ Payment already successful, activating user:', customer.id, planId);
      
      // Get the payment method details for storage
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      await activateSupabaseUser(customer.id, planId, paymentMethod);
    } else {
      console.log('❌ Payment not successful, not activating user:', {
        paymentIntentStatus: paymentIntent?.status,
        subscriptionStatus: subscription.status
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: isPaymentSuccessful(paymentIntent),
        subscription: {
          id: subscription.id,
          status: subscription.status,
          customerId: customer.id,
          clientSecret: paymentIntent?.client_secret,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          planId: planId,
        },
        paymentStatus: paymentIntent?.status || 'unknown'
      }),
    };

  } catch (error) {
    console.error('Stripe subscription creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create subscription', 
        details: error.message 
      }),
    };
  }
}

async function handleConfirmPayment(data, headers) {
  const { paymentIntentId, paymentMethodId } = data;

  console.log('💳 Payment confirmation request:', {
    paymentIntentId,
    hasPaymentMethod: !!paymentMethodId
  });

  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Stripe not configured' }) 
      };
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId
    });

    // SECURITY: Only return success if payment is actually successful
    const isSuccessful = isPaymentSuccessful(paymentIntent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: isSuccessful,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      })
    };

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to confirm payment', 
        details: error.message 
      })
    };
  }
}

async function handleWebhook(event, headers) {
  const signature = event.headers['stripe-signature'];
  const payload = event.body;

  console.log('🔔 Webhook received:', {
    hasSignature: !!signature,
    payloadLength: payload?.length || 0
  });

  try {
    // Validate webhook signature
    const webhookEvent = validateWebhookSignature(payload, signature);
    if (!webhookEvent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid webhook signature' })
      };
    }

    // Handle different webhook events
    switch (webhookEvent.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', webhookEvent.data.object.id);
        // Payment is confirmed successful by Stripe
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', webhookEvent.data.object.id);
        // Payment failed - don't activate user
        break;

      case 'invoice.payment_succeeded':
        console.log('✅ Invoice payment succeeded:', webhookEvent.data.object.id);
        // Subscription payment succeeded
        break;

      case 'invoice.payment_failed':
        console.log('❌ Invoice payment failed:', webhookEvent.data.object.id);
        // Subscription payment failed
        break;

      default:
        console.log('🔔 Unhandled webhook event:', webhookEvent.type);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
}

async function handleCancelSubscription(data, headers) {
  const { subscriptionId } = data;

  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Stripe not configured' }) 
      };
    }

    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status
        }
      })
    };

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to cancel subscription', 
        details: error.message 
      })
    };
  }
}

async function handleGetSubscription(path, headers) {
  const subscriptionId = path.split('/').pop();

  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Stripe not configured' }) 
      };
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          customer: subscription.customer
        }
      })
    };

  } catch (error) {
    console.error('Get subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get subscription', 
        details: error.message 
      })
    };
  }
}

async function handleGetCustomerSubscriptions(path, headers) {
  const customerId = path.split('/')[2];

  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Stripe not configured' }) 
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        subscriptions: subscriptions.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end
        }))
      })
    };

  } catch (error) {
    console.error('Get customer subscriptions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get customer subscriptions', 
        details: error.message 
      })
    };
  }
}
