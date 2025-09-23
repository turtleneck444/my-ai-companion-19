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
    const { amount, currency = 'USD' } = data;
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

// Helpers for subscriptions
function resolvePlanVariationId(planId) {
  // Map app plan ids to Square catalog subscription plan variation ids via env
  // e.g. SQUARE_PLAN_PREMIUM_ID, SQUARE_PLAN_PRO_ID
  const map = {
    premium: process.env.SQUARE_PLAN_PREMIUM_ID,
    pro: process.env.SQUARE_PLAN_PRO_ID,
  };
  return map[planId];
}

async function getOrCreateCustomer(client, { email, givenName }) {
  const customers = client.customersApi;
  if (!email) throw new Error('Email required for subscription');
  try {
    // Search by email
    const search = await customers.searchCustomers({
      query: { filter: { emailAddress: { exact: email } } }
    });
    const found = search?.result?.customers?.[0];
    if (found) return found;
  } catch (e) {
    // continue to create
  }
  const resp = await customers.createCustomer({
    idempotencyKey: `cust_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    emailAddress: email,
    givenName: givenName || 'Customer'
  });
  return resp.result.customer;
}

async function createCardOnFile(client, { customerId, sourceId }) {
  const cards = client.cardsApi;
  const resp = await cards.createCard({
    idempotencyKey: `card_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    sourceId,
    card: { customerId }
  });
  return resp.result.card;
}

async function createSubscription(data, headers) {
  try {
    const { planId, email, name, paymentMethodId } = data; // paymentMethodId is sourceId from SDK
    if (!planId || !paymentMethodId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing plan or payment source' }) };

    const planVariationId = resolvePlanVariationId(planId);
    if (!planVariationId) return { statusCode: 400, headers, body: JSON.stringify({ error: `Missing Square plan mapping for ${planId}` }) };

    const client = getSquareClient();

    // 1) Ensure customer
    const customer = await getOrCreateCustomer(client, { email, givenName: name });

    // 2) Create card on file from sourceId
    const card = await createCardOnFile(client, { customerId: customer.id, sourceId: paymentMethodId });

    // 3) Create subscription
    const subs = client.subscriptionsApi;
    const resp = await subs.createSubscription({
      idempotencyKey: `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      locationId: process.env.SQUARE_LOCATION_ID,
      planVariationId: planVariationId,
      customerId: customer.id,
      cardId: card.id,
      // start immediately, monthly by catalog plan
    });
    const subscription = resp.result.subscription;

    return { statusCode: 200, headers, body: JSON.stringify({ id: subscription.id, status: subscription.status, customerId: customer.id }) };
  } catch (error) {
    console.error('Subscription creation failed:', error);
    const message = error?.message || 'Failed to create subscription';
    return { statusCode: 500, headers, body: JSON.stringify({ error: message }) };
  }
}

async function cancelSubscription(data, headers) {
  try {
    const { subscriptionId } = data;
    const client = getSquareClient();
    const resp = await client.subscriptionsApi.cancelSubscription(subscriptionId);
    return { statusCode: 200, headers, body: JSON.stringify({ id: subscriptionId, status: resp.result.subscription?.status || 'CANCELED' }) };
  } catch (error) {
    console.error('Subscription cancellation failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to cancel subscription' }) };
  }
}

async function handleWebhook(event, headers) {
  try {
    const sig = event.headers['x-square-hmacsha256-signature'];
    const body = event.body || '';
    // TODO: Optionally verify signature with your webhook signature key
    // if (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) { /* verify HMAC */ }

    const data = JSON.parse(body || '{}');
    const type = data?.type || data?.event_type || 'unknown';
    console.log('Square webhook received:', type);

    // Attempt to map to user via customer referenceId if present
    const customerId = data?.data?.object?.subscription?.customer_id || data?.data?.object?.payment?.customer_id;

    // Determine plan status transitions
    let newPlan = null;
    if (type.includes('subscription.created') || type.includes('subscription.activated') || type.includes('invoice.paid')) {
      // You may map subscription.plan_id back to app plan
      newPlan = 'premium';
    }
    if (type.includes('subscription.canceled') || type.includes('invoice.payment_failed')) {
      newPlan = 'free';
    }

    if (newPlan && process.env.SUPABASE_SERVICE_ROLE && process.env.SUPABASE_URL) {
      try {
        // Update user profile metadata via Supabase admin API if you store a mapping
        // This requires you to know the user ID associated to the customer. You can store
        // Square customerId alongside userId in your DB. Placeholder only:
        console.log('Would update Supabase user plan to:', newPlan, 'for customer:', customerId);
      } catch (e) {
        console.warn('Failed to update Supabase from webhook', e);
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook handling failed:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
}
