import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    amount: 0,
    currency: 'usd',
    interval: 'forever',
    priceId: null
  },
  premium: {
    name: 'Premium',
    price: 19.00,
    amount: 1900, // $19.00 in cents
    currency: 'usd',
    interval: 'month',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID
  },
  pro: {
    name: 'Pro',
    price: 49.00,
    amount: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month',
    priceId: process.env.STRIPE_PRO_PRICE_ID
  }
};

// Security: Validate payment success
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

// Activate user in Supabase
async function activateSupabaseUser(customerId, planId, paymentMethod = null) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase not configured');
    return;
  }

  const paymentData = paymentMethod ? {
    payment_method_id: paymentMethod.id,
    card_brand: paymentMethod.card?.brand,
    card_last4: paymentMethod.card?.last4,
    card_exp_month: paymentMethod.card?.exp_month,
    card_exp_year: paymentMethod.card?.exp_year,
    payment_method_created: new Date(paymentMethod.created * 1000).toISOString(),
  } : {};

  try {
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
      const error = await response.text();
      console.error('❌ Supabase activation failed:', error);
    } else {
      console.log('✅ User activated in Supabase:', customerId, planId);
    }
  } catch (error) {
    console.error('❌ Supabase activation error:', error);
  }
}

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { httpMethod, body } = event;
  let data;

  try {
    data = JSON.parse(body || '{}');
  } catch (error) {
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: 'Invalid JSON' }) 
    };
  }

  console.log(`💳 ${httpMethod} ${event.path}`, { 
    hasBody: !!body, 
    provider: data.provider 
  });

  try {
    switch (httpMethod) {
      case 'POST':
        if (event.path.includes('/create-intent')) {
          return await handleCreatePaymentIntent(data, headers);
        } else if (event.path.includes('/create-subscription')) {
          return await handleCreateSubscription(data, headers);
        } else if (event.path.includes('/confirm')) {
          return await handleConfirmPayment(data, headers);
        } else if (event.path.includes('/cancel-subscription')) {
          return await handleCancelSubscription(data, headers);
        }
        break;
      
      case 'GET':
        if (event.path.includes('/subscription/')) {
          const subscriptionId = event.path.split('/subscription/')[1];
          return await handleGetSubscription(subscriptionId, headers);
        } else if (event.path.includes('/customer/') && event.path.includes('/subscriptions')) {
          const customerId = event.path.split('/customer/')[1].split('/subscriptions')[0];
          return await handleGetCustomerSubscriptions(customerId, headers);
        }
        break;
    }

    return { 
      statusCode: 404, 
      headers, 
      body: JSON.stringify({ error: 'Not found' }) 
    };

  } catch (error) {
    console.error('Handler error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Internal server error', details: error.message }) 
    };
  }
}

async function handleCreatePaymentIntent(data, headers) {
  const { planId, userId, amount, currency, provider } = data;
  
  console.log('💳 Payment intent creation request:', {
    planId,
    userId,
    amount,
    currency,
    provider
  });

  if (provider !== 'stripe') {
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: 'Unsupported provider' }) 
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
      console.log('👤 Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { age: customerAge, planId: planId },
      });
      console.log('👤 Created new customer:', customer.id);
    }

    // Attach payment method to customer
    if (paymentMethodId) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
        console.log('💳 Attached payment method to customer');
        
        // Set as default payment method
        await stripe.customers.update(customer.id, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
        console.log('💳 Set as default payment method');
      } catch (attachError) {
        console.error('❌ Failed to attach payment method:', attachError.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to attach payment method', 
            details: attachError.message 
          }),
        };
      }
    }

    // SIMPLIFIED APPROACH: Create subscription directly without SetupIntent
    console.log('💳 Creating subscription directly...');
    
    try {
      // Create subscription with payment method
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.priceId }],
        default_payment_method: paymentMethodId,
        payment_behavior: 'allow_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription' 
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planId: planId,
          customerId: customer.id,
          type: 'subscription'
        }
      });

      console.log('📋 Subscription created:', {
        id: subscription.id,
        status: subscription.status,
        hasLatestInvoice: !!subscription.latest_invoice,
        hasPaymentIntent: !!subscription.latest_invoice?.payment_intent
      });

      // Check if subscription needs payment confirmation
      if (subscription.status === 'incomplete') {
        console.log('💳 Subscription requires payment confirmation');
        
        // Try to get payment intent from expanded data first
        let paymentIntent = subscription.latest_invoice?.payment_intent;
        
        // If no payment intent, try to pay the invoice
        if (!paymentIntent) {
          console.log('💳 No payment intent found, attempting to pay invoice...');
          try {
            const paidInvoice = await stripe.invoices.pay(subscription.latest_invoice.id);
            paymentIntent = paidInvoice.payment_intent;
            console.log('💳 Invoice payment attempted:', {
              id: paidInvoice.id,
              status: paidInvoice.status,
              hasPaymentIntent: !!paymentIntent
            });
          } catch (payError) {
            console.log('💳 Invoice payment failed:', payError.message);
            // If payment fails, the subscription will remain incomplete
          }
        }
        
        if (paymentIntent) {
          console.log('💳 Payment intent found:', paymentIntent.id);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              subscription: {
                id: subscription.id,
                status: subscription.status,
                customerId: customer.id,
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                planId: planId,
              },
              clientSecret: paymentIntent.client_secret,
              paymentStatus: 'requires_confirmation'
            }),
          };
        } else {
          console.log('❌ No payment intent available for confirmation');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              subscription: {
                id: subscription.id,
                status: subscription.status,
                customerId: customer.id,
                planId: planId,
              },
              paymentStatus: 'incomplete',
              error: 'No payment intent available for confirmation'
            }),
          };
        }
      } else if (subscription.status === 'active') {
        console.log('✅ Subscription active, activating user...');
        
        // Activate user in Supabase
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        await activateSupabaseUser(customer.id, planId, paymentMethod);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              customerId: customer.id,
              currentPeriodStart: subscription.current_period_start,
              currentPeriodEnd: subscription.current_period_end,
              planId: planId,
            },
            paymentStatus: 'succeeded'
          }),
        };
      } else {
        console.log('❌ Subscription creation failed:', {
          subscriptionId: subscription.id,
          status: subscription.status
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              customerId: customer.id,
              planId: planId,
            },
            paymentStatus: subscription.status,
            error: 'Subscription creation failed'
          }),
        };
      }
    } catch (subscriptionError) {
      console.error('❌ Subscription creation failed:', subscriptionError.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          subscription: {
            id: null,
            status: 'failed',
            customerId: customer.id,
            planId: planId,
          },
          paymentStatus: 'failed',
          error: subscriptionError.message || 'Subscription creation failed'
        }),
      };
    }

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
    
    console.log('💳 Payment confirmation result:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      isSuccessful
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: isSuccessful,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret
        }
      }),
    };

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to confirm payment', 
        details: error.message 
      }),
    };
  }
}

async function handleCancelSubscription(data, headers) {
  const { subscriptionId } = data;

  console.log('💳 Subscription cancellation request:', { subscriptionId });

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
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        }
      }),
    };

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to cancel subscription', 
        details: error.message 
      }),
    };
  }
}

async function handleGetSubscription(subscriptionId, headers) {
  console.log('💳 Get subscription request:', { subscriptionId });

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
        id: subscription.id,
        status: subscription.status,
        customerId: subscription.customer,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        planId: subscription.items.data[0]?.price.id
      }),
    };

  } catch (error) {
    console.error('Get subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get subscription', 
        details: error.message 
      }),
    };
  }
}

async function handleGetCustomerSubscriptions(customerId, headers) {
  console.log('💳 Get customer subscriptions request:', { customerId });

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

    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      customerId: sub.customer,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      planId: sub.items.data[0]?.price.id
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedSubscriptions),
    };

  } catch (error) {
    console.error('Get customer subscriptions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get customer subscriptions', 
        details: error.message 
      }),
    };
  }
}
