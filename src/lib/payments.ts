// Payment configuration and utilities
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '5 messages per day',
      '1 voice call per day',
      'Basic AI companions',
      'Community support'
    ],
    limits: {
      messages: 5,
      voiceCalls: 1,
      companions: 1
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1900, // $19.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '50 messages per day',
      '5 voice calls per day',
      'Up to 3 AI companions',
      'Custom personality creation',
      'Advanced voice features',
      'Priority support'
    ],
    limits: {
      messages: 50,
      voiceCalls: 5,
      companions: 3
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited messages',
      'Unlimited voice calls',
      'Up to 10 AI companions',
      'Advanced customization',
      'API access',
      'White-label options'
    ],
    limits: {
      messages: -1, // -1 means unlimited
      voiceCalls: -1,
      companions: 10
    }
  }
};

export const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    environment: import.meta.env.VITE_PAYMENT_ENVIRONMENT || 'test'
  }
};

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  plan: string;
}

// Helper function to get plan by ID
export const getPlanById = (planId: string) => {
  return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
};

// Helper function to format price
export const formatPrice = (priceInCents: number) => {
  if (priceInCents === 0) return 'Free';
  return `$${(priceInCents / 100).toFixed(2)}`;
};

// Helper function to get remaining companions for a plan
export const getRemainingCompanions = (planId: string, currentCount: number = 0) => {
  const plan = getPlanById(planId);
  const limit = plan.limits.companions;
  if (limit === -1) return -1; // Unlimited
  return Math.max(0, limit - currentCount);
};

// Helper function to check if user can create more companions
export const checkCompanionLimit = (planId: string, currentCount: number = 0) => {
  const remaining = getRemainingCompanions(planId, currentCount);
  return remaining === -1 || remaining > 0;
};

export const createPaymentIntent = async (planId: string): Promise<PaymentIntent> => {
  const response = await fetch('/.netlify/functions/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'createPaymentIntent',
      plan: planId
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Payment failed');
  }

  return {
    id: data.paymentIntentId || 'pi_demo',
    client_secret: data.clientSecret || 'pi_demo_secret',
    amount: data.plan?.price || 0,
    currency: 'usd',
    status: 'requires_payment_method'
  };
};

export const createSubscription = async (planId: string, customerId?: string): Promise<Subscription> => {
  const response = await fetch('/.netlify/functions/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'createSubscription',
      plan: planId,
      customerId
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Subscription failed');
  }

  return {
    id: data.subscriptionId || 'sub_demo',
    status: 'active',
    current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    plan: planId
  };
};

export const getPlans = async () => {
  const response = await fetch('/.netlify/functions/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'getPlans'
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get plans');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to load plans');
  }

  return data.plans || SUBSCRIPTION_PLANS;
};
