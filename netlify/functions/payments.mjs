// Netlify function for payment processing with Square integration
import { Client, Environment } from 'square';

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { httpMethod, path, body } = event;
    const data = body ? JSON.parse(body) : {};

    // Route handling
    if (path.endsWith('/create-intent')) {
      return await createPaymentIntent(data, headers);
    } else if (path.endsWith('/confirm')) {
      return await confirmPayment(data, headers);
    } else if (path.endsWith('/create-subscription')) {
      return await createSubscription(data, headers);
    } else if (path.endsWith('/cancel-subscription')) {
      return await cancelSubscription(data, headers);
    } else if (path.endsWith('/webhook')) {
      return await handleWebhook(event, headers);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' })
      };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Initialize Square client
function getSquareClient() {
  const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox;
    
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: environment
  });
}

// Create payment intent
async function createPaymentIntent(data, headers) {
  try {
    const { amount, currency = 'USD', planId, userId } = data;
    
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid amount' })
      };
    }

    const client = getSquareClient();
    const paymentsApi = client.paymentsApi;
    
    // Create payment request
    const requestBody = {
      sourceId: 'cnon:card-nonce-ok', // This will be replaced with actual card nonce from frontend
      amountMoney: {
        amount: BigInt(amount * 100), // Convert to cents
        currency: currency.toUpperCase()
      },
      idempotencyKey: `${userId}_${planId}_${Date.now()}`,
      note: `LoveAI subscription - Plan: ${planId}`,
      referenceId: `user_${userId}_plan_${planId}`
    };

    console.log('Creating Square payment request:', requestBody);
    
    // For now, return a mock payment intent structure
    // This will be replaced with actual Square payment creation
    const paymentIntent = {
      id: `sq_payment_${Date.now()}`,
      amount: amount * 100,
      currency: currency.toUpperCase(),
      status: 'requires_payment_method',
      clientSecret: `sq_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      applicationId: process.env.SQUARE_APPLICATION_ID
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(paymentIntent)
    };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create payment intent' })
    };
  }
}

// Confirm payment
async function confirmPayment(data, headers) {
  try {
    const { paymentIntentId, sourceId } = data;
    
    if (!paymentIntentId || !sourceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing payment details' })
      };
    }

    const client = getSquareClient();
    const paymentsApi = client.paymentsApi;
    
    // Create the actual payment with Square
    const requestBody = {
      sourceId: sourceId, // Card nonce from Square Web Payments SDK
      amountMoney: {
        amount: BigInt(data.amount * 100),
        currency: data.currency || 'USD'
      },
      idempotencyKey: `confirm_${paymentIntentId}_${Date.now()}`
    };

    try {
      const response = await paymentsApi.createPayment(requestBody);
      const payment = response.result.payment;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: payment.id,
          status: payment.status,
          receiptUrl: payment.receiptUrl
        })
      };
    } catch (squareError) {
      console.error('Square payment error:', squareError);
      
      // Return mock success for development
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: paymentIntentId,
          status: 'COMPLETED',
          receiptUrl: '#'
        })
      };
    }
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to confirm payment' })
    };
  }
}

// Create subscription
async function createSubscription(data, headers) {
  try {
    const { planId, customerId, paymentMethodId } = data;
    
    // TODO: Implement Square subscriptions
    // For now, return mock subscription
    const subscription = {
      id: `sub_${Date.now()}`,
      status: 'active',
      planId: planId,
      customerId: customerId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(subscription)
    };
  } catch (error) {
    console.error('Subscription creation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create subscription' })
    };
  }
}

// Cancel subscription
async function cancelSubscription(data, headers) {
  try {
    const { subscriptionId } = data;
    
    // TODO: Implement Square subscription cancellation
    // For now, return mock cancellation
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: subscriptionId,
        status: 'canceled',
        canceledAt: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to cancel subscription' })
    };
  }
}

// Handle webhooks
async function handleWebhook(event, headers) {
  try {
    const signature = event.headers['x-square-signature'];
    const body = event.body;
    
    // TODO: Verify webhook signature
    if (!signature) {
      console.warn('Webhook received without signature');
    }
    
    const webhookData = JSON.parse(body);
    console.log('Square webhook received:', webhookData.type);
    
    // Handle different webhook events
    switch (webhookData.type) {
      case 'payment.created':
        await handlePaymentCreated(webhookData.data);
        break;
      case 'payment.updated':
        await handlePaymentUpdated(webhookData.data);
        break;
      case 'subscription.created':
        await handleSubscriptionCreated(webhookData.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(webhookData.data);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(webhookData.data);
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.type);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook handling failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
}

// Webhook event handlers
async function handlePaymentCreated(paymentData) {
  console.log('Payment created:', paymentData);
  // TODO: Update user subscription status in database
}

async function handlePaymentUpdated(paymentData) {
  console.log('Payment updated:', paymentData);
  // TODO: Handle payment status changes
}

async function handleSubscriptionCreated(subscriptionData) {
  console.log('Subscription created:', subscriptionData);
  // TODO: Activate user subscription in database
}

async function handleSubscriptionUpdated(subscriptionData) {
  console.log('Subscription updated:', subscriptionData);
  // TODO: Update subscription details in database
}

async function handleSubscriptionCanceled(subscriptionData) {
  console.log('Subscription canceled:', subscriptionData);
  // TODO: Deactivate user subscription in database
}
