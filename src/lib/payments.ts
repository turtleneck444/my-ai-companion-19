// Enhanced payment processing with real Stripe integration
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

export interface PaymentConfig {
  provider: 'stripe' | 'square' | 'paypal' | 'razorpay';
  publishableKey: string;
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
  clientSecret: string;
  status: string;
}

export interface Subscription {
  id: string;
  status: string;
  customerId: string;
  clientSecret?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  planId: string;
}

// Payment configuration
export const PAYMENT_CONFIG: PaymentConfig = {
  provider: (import.meta.env.VITE_PAYMENT_PROVIDER as any) || 'stripe',
  publishableKey: import.meta.env.VITE_PAYMENT_PUBLISHABLE_KEY || '',
  environment: (import.meta.env.VITE_PAYMENT_ENVIRONMENT as any) || 'test'
};

// Updated subscription plans with Stripe price IDs
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

const API_BASE = import.meta.env.DEV ? '/api/payments' : '/.netlify/functions/payments';

// Enhanced payment processing with real Stripe integration
export class PaymentProcessor {
  private config: PaymentConfig;
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  constructor() {
    this.config = PAYMENT_CONFIG;
    this.initializeStripe();
  }

  private async initializeStripe() {
    if (this.config.provider === 'stripe' && this.config.publishableKey) {
      this.stripe = await loadStripe(this.config.publishableKey);
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(planId: string, userId?: string): Promise<PaymentIntent> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    const response = await fetch(`${API_BASE}/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId,
        amount: plan.price,
        currency: plan.currency.toLowerCase(),
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
  }

  // Confirm payment
  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    const response = await fetch(`${API_BASE}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm payment');
    }

    return response.json();
  }

  // Create subscription
  async createSubscription(
    planId: string, 
    paymentMethodId: string, 
    userId?: string,
    customerId?: string
  ): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId,
        paymentMethodId,
        customerId,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create subscription');
    }

    return response.json();
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        provider: this.config.provider
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return response.json();
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/subscription/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get subscription');
    }

    return response.json();
  }

  // Get customer subscriptions
  async getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
    const response = await fetch(`${API_BASE}/customer/${customerId}/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get customer subscriptions');
    }

    return response.json();
  }

  // Get Stripe instance for frontend integration
  getStripe(): Stripe | null {
    return this.stripe;
  }

  // Check if payment provider is configured
  isConfigured(): boolean {
    return this.config.provider === 'stripe' && !!this.config.publishableKey;
  }

  // Get available payment methods
  getPaymentMethods(): string[] {
    switch (this.config.provider) {
      case 'stripe':
        return ['card', 'apple_pay', 'google_pay'];
      case 'square':
        return ['card', 'apple_pay', 'google_pay'];
      case 'paypal':
        return ['paypal'];
      case 'razorpay':
        return ['card', 'netbanking', 'upi', 'wallet'];
      default:
        return ['card'];
    }
  }
}

// Export singleton instance
export const paymentProcessor = new PaymentProcessor();

// Helper function to format price
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
}

// Helper function to get plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

// Helper function to check if user can access feature
export function canAccessFeature(
  userPlan: string, 
  feature: keyof SubscriptionPlan['limits']
): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;
  
  const limit = plan.limits[feature];
  return limit === true || limit === -1 || limit > 0;
}

// Usage tracking helper functions
export function checkMessageLimit(userPlan: string, messagesUsed: number): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;
  
  const limit = plan.limits.messagesPerDay;
  return limit === -1 || messagesUsed < limit; // -1 means unlimited
}

export function checkVoiceCallLimit(userPlan: string, voiceCallsUsed: number): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;
  
  const limit = plan.limits.voiceCallsPerDay;
  return limit === -1 || voiceCallsUsed < limit; // -1 means unlimited
}

export function getRemainingMessages(userPlan: string, messagesUsed: number): number {
  const plan = getPlanById(userPlan);
  if (!plan) return 0;
  
  const limit = plan.limits.messagesPerDay;
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - messagesUsed);
}

export function getRemainingVoiceCalls(userPlan: string, voiceCallsUsed: number): number {
  const plan = getPlanById(userPlan);
  if (!plan) return 0;
  
  const limit = plan.limits.voiceCallsPerDay;
  if (limit === -1) return -1; // unlimited
  return Math.max(0, limit - voiceCallsUsed);
}
