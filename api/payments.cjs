// Real Payment processing API endpoints with Square and Stripe integration
const express = require('express');

// Make Stripe completely optional (only used when provider==='stripe')
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your_stripe_secret_key') {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn('Stripe SDK load failed, continuing without Stripe:', e?.message);
  }
}

const router = express.Router();

// Create payment intent endpoint
router.post('/create-intent', async (req, res) => {
  try {
    const { planId, userId, amount, currency = 'usd', provider = 'square', sourceId } = req.body;

    console.log('💳 Payment request:', { planId, amount, currency, provider, hasSourceId: !!sourceId });

    if (provider === 'stripe') {
      if (!stripe || !process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { planId, userId: userId || 'anonymous' },
        automatic_payment_methods: { enabled: true },
      });
      return res.json({ id: paymentIntent.id, clientSecret: paymentIntent.client_secret, status: paymentIntent.status });
    }

    if (provider === 'square') {
      if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
        console.log('❌ Square not properly configured');
        return res.status(500).json({ error: 'Square not configured' });
      }

      if (!sourceId || typeof sourceId !== 'string') {
        return res.status(400).json({ error: 'Missing sourceId from Square card tokenization' });
      }

      console.log('🔄 Processing REAL Square payment...');
      
      try {
        // Use Square's REST API directly
        const squareApiUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
          ? 'https://connect.squareup.com/v2' 
          : 'https://connect.squareupsandbox.com/v2';
        
        // Generate unique idempotency key
        const idempotencyKey = `${planId}-${userId || 'anonymous'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const paymentData = {
          idempotency_key: idempotencyKey,
          source_id: sourceId,
          amount_money: {
            amount: Math.round(amount * 100),
            currency: currency.toUpperCase()
          },
          location_id: process.env.SQUARE_LOCATION_ID,
          reference_id: `${planId}-${userId || 'anonymous'}-${Date.now()}`,
          note: `LoveAI ${planId} plan payment`
        };

        console.log('📡 Calling Square API:', squareApiUrl + '/payments');
        console.log('🔑 Idempotency Key:', idempotencyKey);
        
        const response = await fetch(squareApiUrl + '/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2023-10-18'
          },
          body: JSON.stringify(paymentData)
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error('❌ Square API error:', result);
          return res.status(500).json({ 
            error: 'Square payment failed', 
            details: result.errors?.[0]?.detail || 'Unknown error'
          });
        }

        if (result.payment) {
          console.log('✅ Square payment successful:', result.payment.id);
          console.log('💰 Amount charged:', result.payment.amount_money.amount / 100, result.payment.amount_money.currency);
          return res.json({ 
            id: result.payment.id, 
            status: result.payment.status, 
            referenceId: result.payment.reference_id,
            amount: result.payment.amount_money.amount,
            currency: result.payment.amount_money.currency
          });
        }

        throw new Error('No payment data returned from Square');

      } catch (apiError) {
        console.error('❌ Square API call failed:', apiError.message);
        return res.status(500).json({ 
          error: 'Square payment failed', 
          details: apiError.message 
        });
      }
    }

    return res.status(400).json({ error: `Payment provider '${provider}' is not supported` });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

// Create customer and save card for future billing
router.post('/create-customer', async (req, res) => {
  try {
    const { email, sourceId, planId } = req.body;
    
    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
      return res.status(500).json({ error: 'Square not configured' });
    }

    console.log('👤 Creating Square customer for:', email);
    
    const squareApiUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? 'https://connect.squareup.com/v2' 
      : 'https://connect.squareupsandbox.com/v2';

    // Create customer
    const customerData = {
      given_name: email.split('@')[0],
      email_address: email,
      reference_id: `loveai-${email}-${Date.now()}`
    };

    const customerResponse = await fetch(squareApiUrl + '/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(customerData)
    });

    const customerResult = await customerResponse.json();
    
    if (!customerResponse.ok) {
      console.error('❌ Square customer creation failed:', customerResult);
      return res.status(500).json({ 
        error: 'Customer creation failed', 
        details: customerResult.errors?.[0]?.detail 
      });
    }

    const customerId = customerResult.customer.id;
    console.log('✅ Square customer created:', customerId);

    // Save card to customer
    const cardData = {
      source_id: sourceId,
      card: {
        customer_id: customerId
      }
    };

    const cardResponse = await fetch(squareApiUrl + '/cards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18'
      },
      body: JSON.stringify(cardData)
    });

    const cardResult = await cardResponse.json();
    
    if (!cardResponse.ok) {
      console.error('❌ Square card saving failed:', cardResult);
      return res.status(500).json({ 
        error: 'Card saving failed', 
        details: cardResult.errors?.[0]?.detail 
      });
    }

    const cardId = cardResult.card.id;
    console.log('✅ Square card saved:', cardId);

    return res.json({
      customerId,
      cardId,
      status: 'success'
    });

  } catch (error) {
    console.error('Customer creation failed:', error);
    res.status(500).json({ error: 'Failed to create customer', details: error.message });
  }
});

// Webhook endpoint for payment confirmations
router.post('/webhook', async (req, res) => {
  try {
    const { provider = 'square' } = req.query;

    if (provider === 'stripe' && stripe) {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
      }
    }

    if (provider === 'square') {
      const body = req.body;
      console.log('Square webhook received:', body);
      // Handle Square webhook
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
