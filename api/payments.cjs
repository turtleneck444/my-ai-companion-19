// Square-only payment API endpoints (Stripe removed)
const express = require('express');
const router = express.Router();

function requireSquareEnv(res) {
  const missing = [];
  if (!process.env.SQUARE_ACCESS_TOKEN) missing.push('SQUARE_ACCESS_TOKEN');
  if (!process.env.SQUARE_LOCATION_ID) missing.push('SQUARE_LOCATION_ID');
  if (!process.env.SQUARE_ENVIRONMENT) missing.push('SQUARE_ENVIRONMENT');
  if (missing.length) {
    res.status(500).json({ error: `Square config missing: ${missing.join(', ')}` });
    return false;
  }
  return true;
}

async function activateSupabaseUser(userId, planId) {
  try {
    if (!userId) return;
    const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}`;
    const body = {
      subscription_status: planId === 'free' ? 'free' : 'active',
      plan: planId,
      subscription_plan_id: planId,
      updated_at: new Date().toISOString()
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      console.warn('Supabase profile activation failed:', t);
    }
  } catch (e) {
    console.warn('activateSupabaseUser error:', e);
  }
}

router.post('/create-intent', async (req, res) => {
  try {
    const { planId, userId, amount, currency = 'usd', sourceId } = req.body;
    console.log('💳 Payment request:', { planId, amount, currency, hasSourceId: !!sourceId, userId });

    if (!requireSquareEnv(res)) return;
    if (!sourceId || typeof sourceId !== 'string') {
      return res.status(400).json({ error: 'Missing sourceId from Square card tokenization' });
    }

    const baseUrl = process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2';

    const idempotencyKey = `${planId}-${userId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const paymentData = {
      idempotency_key: idempotencyKey,
      source_id: sourceId,
      amount_money: {
        amount: Math.round(Number(amount) * 100),
        currency: String(currency || 'usd').toUpperCase()
      },
      location_id: process.env.SQUARE_LOCATION_ID,
      reference_id: `${planId}-${userId || 'anonymous'}`,
      note: `LoveAI ${planId} plan`
    };

    const response = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('❌ Square API error:', result);
      return res.status(500).json({ error: 'Square payment failed', details: result?.errors?.[0]?.detail || 'Unknown' });
    }

    const pay = result.payment;
    if (!pay) return res.status(500).json({ error: 'No payment returned' });

    // On success, activate Supabase user with the selected plan
    if (['COMPLETED', 'APPROVED'].includes(String(pay.status || '').toUpperCase())) {
      await activateSupabaseUser(userId, planId);
    }

    return res.json({ id: pay.id, status: pay.status, referenceId: pay.reference_id, amount: pay.amount_money?.amount, currency: pay.amount_money?.currency });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

router.post('/create-customer', async (req, res) => {
  try {
    const { email, sourceId } = req.body;
    if (!requireSquareEnv(res)) return;
    if (!email) return res.status(400).json({ error: 'email required' });
    if (!sourceId) return res.status(400).json({ error: 'sourceId required' });

    const baseUrl = process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2';

    const customerResponse = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify({
        given_name: email.split('@')[0],
        email_address: email,
        reference_id: `loveai-${Date.now()}`
      })
    });
    const customerResult = await customerResponse.json();
    if (!customerResponse.ok) {
      console.error('❌ Square customer creation failed:', customerResult);
      return res.status(500).json({ error: 'Customer creation failed', details: customerResult?.errors?.[0]?.detail });
    }
    const customerId = customerResult?.customer?.id;

    const cardResponse = await fetch(`${baseUrl}/cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify({ source_id: sourceId, card: { customer_id: customerId } })
    });
    const cardResult = await cardResponse.json();
    if (!cardResponse.ok) {
      console.error('❌ Square card saving failed:', cardResult);
      return res.status(500).json({ error: 'Card saving failed', details: cardResult?.errors?.[0]?.detail });
    }

    return res.json({ customerId, cardId: cardResult?.card?.id, status: 'success' });
  } catch (error) {
    console.error('Customer creation failed:', error);
    res.status(500).json({ error: 'Failed to create customer', details: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    console.log('Square webhook received');
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
