// Payment processing configuration and utilities
// Configure your payment provider by setting the appropriate environment variables

export interface PaymentConfig {
  provider: 'stripe' | 'square' | 'paypal' | 'razorpay';
  publishableKey: string;
  // Secrets must NEVER be bundled client-side
  // They are intentionally omitted from the client configuration
  environment: 'test' | 'live';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    messagesPerDay: number;
    voiceCallsPerDay: number;
    companions: number;
    customPersonalities: boolean;
    advancedFeatures: boolean;
  };
  popular?: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'requires_payment_method' | 'COMPLETED';
  clientSecret?: string;
  applicationId?: string;
  receiptUrl?: string;
}

// Payment provider configurations (client-safe only)
export const PAYMENT_CONFIG: PaymentConfig = {
  provider: (import.meta.env.VITE_PAYMENT_PROVIDER as any) || 'stripe',
  publishableKey: import.meta.env.VITE_PAYMENT_PUBLISHABLE_KEY || '',
  environment: (import.meta.env.VITE_PAYMENT_ENVIRONMENT as any) || 'test'
};

const API_BASE = import.meta.env.DEV ? '/api/payments' : '/.netlify/functions/payments';

// Updated subscription plans with consumer-focused Pro tier
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '5 messages per day',
      '1 AI Companion',
      'Basic personalities only',
      'Text chat only',
      'Community support',
      'Limited customization'
    ],
    limits: {
      messagesPerDay: 5,
      voiceCallsPerDay: 0,
      companions: 1,
      customPersonalities: false,
      advancedFeatures: false
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19,
    currency: 'USD',
    interval: 'month',
    features: [
      '50 messages per day',
      '5 voice calls per day',
      'Up to 3 AI Companions',
      'Custom personality creation',
      'Advanced voice features',
      'Priority support',
      'Early access to new features',
      'Enhanced customization options'
    ],
    limits: {
      messagesPerDay: 50,
      voiceCallsPerDay: 5,
      companions: 3,
      customPersonalities: true,
      advancedFeatures: true
    },
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited messages per day',
      'Unlimited voice calls per day',
      'Unlimited AI Companions',
      'Advanced personality customization',
      'Premium voice options',
      'Custom voice creation',
      'Advanced AI training',
      'Priority support',
      'Early access to all features',
      'Advanced analytics & insights',
      'Exclusive companion themes',
      'Premium customer support'
    ],
    limits: {
      messagesPerDay: -1, // -1 means unlimited
      voiceCallsPerDay: -1, // -1 means unlimited
      companions: -1, // -1 means unlimited
      customPersonalities: true,
      advancedFeatures: true
    }
  }
];

// Payment processing functions
export class PaymentProcessor {
  private config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  async createPaymentIntent(planId: string, userId: string): Promise<PaymentIntent> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const response = await fetch(`${API_BASE}/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId,
        userId,
        amount: plan.price,
        currency: plan.currency,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  }

  async confirmPayment(params: { paymentIntentId: string; sourceId: string; amount: number; currency: string; }): Promise<PaymentIntent> {
    const response = await fetch(`${API_BASE}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentIntentId: params.paymentIntentId,
        sourceId: params.sourceId,
        amount: params.amount,
        currency: params.currency,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      throw new Error('Failed to confirm payment');
    }

    return await response.json();
  }

  async createSubscription(planId: string, userId: string, paymentMethodId: string, customer?: { email?: string; name?: string; }): Promise<any> {
    const response = await fetch(`${API_BASE}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId,
        // userId kept for backward compatibility but not required for Square
        userId,
        paymentMethodId,
        email: customer?.email,
        name: customer?.name,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    return await response.json();
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  }
}

// Initialize payment processor
export const paymentProcessor = new PaymentProcessor(PAYMENT_CONFIG);

// Utility functions
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const isPaymentConfigured = (): boolean => {
  // Only publishable key is needed on the client
  return !!(PAYMENT_CONFIG.publishableKey);
};

// Usage tracking utilities
export const checkMessageLimit = (currentPlan: string, messagesUsed: number): boolean => {
  const plan = getPlanById(currentPlan);
  if (!plan) return false;
  
  if (plan.limits.messagesPerDay === -1) return true; // Unlimited
  return messagesUsed < plan.limits.messagesPerDay;
};

export const checkVoiceCallLimit = (currentPlan: string, callsUsed: number): boolean => {
  const plan = getPlanById(currentPlan);
  if (!plan) return false;
  
  if (plan.limits.voiceCallsPerDay === -1) return true; // Unlimited
  return callsUsed < plan.limits.voiceCallsPerDay;
};

export const getRemainingMessages = (currentPlan: string, messagesUsed: number): number => {
  const plan = getPlanById(currentPlan);
  if (!plan) return 0;
  
  if (plan.limits.messagesPerDay === -1) return -1; // Unlimited
  return Math.max(0, plan.limits.messagesPerDay - messagesUsed);
};

export const getRemainingVoiceCalls = (currentPlan: string, callsUsed: number): number => {
  const plan = getPlanById(currentPlan);
  if (!plan) return 0;
  
  if (plan.limits.voiceCallsPerDay === -1) return true as any; // keep type compat
  return Math.max(0, plan.limits.voiceCallsPerDay - callsUsed);
};
