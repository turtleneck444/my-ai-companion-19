// Netlify function for payment processing with Square integration
import { Client, Environment } from 'square';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { path, body } = event;
    const data = body ? JSON.parse(body) : {};

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
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint not found' }) };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

function getSquareClient() {
  const environment = process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox;
  return new Client({ accessToken: process.env.SQUARE_ACCESS_TOKEN, environment });
}

async function createPaymentIntent(data, headers) {
  try {
    const { amount, currency = 'USD', planId, userId } = data;
    if (!amount || amount <= 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };

    const paymentIntent = {
      id: `sq_intent_${Date.now()}`,
      amount: amount * 100,
      currency: currency.toUpperCase(),
      status: 'requires_payment_method',
      applicationId: process.env.SQUARE_APPLICATION_ID
    };

    return { statusCode: 200, headers, body: JSON.stringify(paymentIntent) };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create payment intent' }) };
  }
}

async function confirmPayment(data, headers) {
  try {
    const { paymentIntentId, sourceId, amount, currency } = data;
    if (!paymentIntentId || !sourceId || !amount) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing payment details' }) };

    const client = getSquareClient();
    const paymentsApi = client.paymentsApi;

    const requestBody = {
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: (currency || 'USD').toUpperCase()
      },
      idempotencyKey: `confirm_${paymentIntentId}_${Date.now()}`,
      locationId: process.env.SQUARE_LOCATION_ID
    };

    const response = await paymentsApi.createPayment(requestBody);
    const payment = response.result.payment;

    return { statusCode: 200, headers, body: JSON.stringify({ id: payment.id, status: payment.status, receiptUrl: payment.receiptUrl }) };
  } catch (error) {
    console.error('Square payment error:', error);
    const message = error?.message || 'Payment error';
    return { statusCode: 500, headers, body: JSON.stringify({ error: message }) };
  }
}

async function createSubscription(data, headers) {
  try {
    const { planId, customerId, paymentMethodId } = data;
    const subscription = { id: `sub_${Date.now()}`, status: 'active', planId, customerId, currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
    return { statusCode: 200, headers, body: JSON.stringify(subscription) };
  } catch (error) {
    console.error('Subscription creation failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create subscription' }) };
  }
}

async function cancelSubscription(data, headers) {
  try {
    const { subscriptionId } = data;
    return { statusCode: 200, headers, body: JSON.stringify({ id: subscriptionId, status: 'canceled', canceledAt: new Date().toISOString() }) };
  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to cancel subscription' }) };
  }
}

async function handleWebhook(event, headers) {
  try {
    const webhookData = JSON.parse(event.body || '{}');
    console.log('Square webhook received:', webhookData.type);
    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook handling failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
}
