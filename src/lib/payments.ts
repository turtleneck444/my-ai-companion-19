// Enhanced payment processing with Stripe support
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

export interface PaymentConfig {
  provider: 'stripe';
  publishableKey: string;
  environment: 'test' | 'live' | 'production';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'forever';
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
  currentPeriodStart: number;
  currentPeriodEnd: number;
  planId: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
}

export interface CreateSubscriptionOptions {
  planId: string;
  paymentMethodId: string;
  customerEmail?: string;
  customerName?: string;
  customerAge?: string;
  userId?: string;
  customerId?: string;
}

// Payment configuration
export const PAYMENT_CONFIG: PaymentConfig = {
  provider: 'stripe',
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  environment: (import.meta.env.VITE_PAYMENT_ENVIRONMENT as any) || 'test',
};

// Updated subscription plans with detailed features matching the reference guide
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'forever',
    features: [
      '5 messages per day',
      '1 voice call per day',
      '1 AI Companion',
      'Basic personality options',
      'Standard response time'
    ],
    limits: {
      messagesPerDay: 5,
      voiceCallsPerDay: 1,
      companions: 1,
      customPersonalities: false,
      advancedFeatures: false
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.00,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited messages',
      '10 voice calls per day',
      '3 AI Companions',
      'Custom personality creation',
      'Advanced voice features',
      'Priority support',
      'Early access to new features'
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
    price: 49.00,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited messages',
      'Unlimited voice calls',
      'Unlimited AI Companions',
      'Advanced AI training',
      'Custom voice creation',
      'Advanced analytics API access insights',
      'Exclusive companion themes',
      'Dedicated support',
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
    this.initializePaymentProvider();
  }

  public async initializePaymentProvider() {
    if (this.config.provider === 'stripe' && this.config.publishableKey) {
      this.stripe = await loadStripe(this.config.publishableKey);
    }
  }

  // Create payment intent for one-time payments (Stripe)
  async createPaymentIntent(planId: string, userId?: string): Promise<PaymentIntent> {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    try {
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
        // Only simulate in development; in production surface the error
        if (import.meta.env.DEV && (response.status >= 500 || !response.headers.get('content-type')?.includes('application/json'))) {
          console.warn('Backend not available, simulating payment intent (DEV only)');
          return {
            id: `dev_pi_${Date.now()}`,
            clientSecret: `dev_pi_${Date.now()}_secret`,
            status: 'requires_payment_method'
          };
        }
        const error = await response.json().catch(() => ({ error: 'Failed to create payment intent' }));
        throw new Error(error.error || 'Failed to create payment intent');
      }

      return response.json();
    } catch (networkError) {
      // Only simulate in development
      if (import.meta.env.DEV) {
        console.warn('Backend not available, simulating payment intent (DEV only)');
        return {
          id: `dev_pi_${Date.now()}`,
          clientSecret: `dev_pi_${Date.now()}_secret`,
          status: 'requires_payment_method'
        };
      }
      throw networkError;
    }
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
    customerEmail?: string,
    customerName?: string,
    customerAge?: string,
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
        customerEmail,
        customerName,
        customerAge,
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

  // Get configuration
  getConfig(): PaymentConfig {
    return { ...this.config };
  }

  // Check if Stripe is properly configured and initialized
  async ensureStripeInitialized(): Promise<boolean> {
    if (this.config.provider !== "stripe") return false;
    
    if (!this.config.publishableKey) {
      console.error("Stripe publishable key not configured");
      return false;
    }

    if (!this.stripe) {
      console.error("Stripe not initialized");
      return false;
    }

    return true;
  }

  // Process payment (for unified signup flow)
  async processPayment(options: {
    amount: number;
    currency: string;
    planId: string;
    customerEmail: string;
  }): Promise<{ success: boolean; error?: string; paymentIntentId?: string }> {
    try {
      // For free plans, return success immediately
      if (options.amount === 0) {
        return { success: true, paymentIntentId: 'free-plan' };
      }

      // For Stripe: Create and then confirm intent
      const paymentIntent = await this.createPaymentIntent(options.planId);

      // Only simulate success on dev
      if (import.meta.env.DEV && paymentIntent.id.startsWith('dev_pi_')) {
        console.log('🧪 Development mode: simulating successful payment');
        return { success: true, paymentIntentId: paymentIntent.id };
      }

      // In production, confirm the payment
      const confirmedPayment = await this.confirmPayment(paymentIntent.id);
      
      if (confirmedPayment.status === 'succeeded') {
        return { success: true, paymentIntentId: confirmedPayment.id };
      } else {
        return { success: false, error: `Payment failed with status: ${confirmedPayment.status}` };
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return { success: false, error: error.message || 'Payment processing failed' };
    }
  }
}

// Export default instance
export const paymentProcessor = new PaymentProcessor();

// Helper function to get plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

// Helper function to format price
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}
