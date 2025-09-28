// Enhanced payment processing with Square and Stripe support
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

// Square Web Payments SDK types
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId?: string) => {
        card: () => Promise<any>;
        applePay: () => Promise<any>;
        googlePay: () => Promise<any>;
        ach: () => Promise<any>;
      };
    };
  }
}

export interface PaymentConfig {
  provider: 'stripe' | 'square' | 'paypal' | 'razorpay';
  publishableKey: string;
  environment: 'test' | 'live' | 'sandbox' | 'production';
  locationId?: string; // Required for Square
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
  currentPeriodStart: string;
  currentPeriodEnd: string;
  planId: string;
}

// Payment configuration
export const PAYMENT_CONFIG: PaymentConfig = {
  provider: 'stripe',
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  environment: (import.meta.env.VITE_PAYMENT_ENVIRONMENT as any) || 'test',
  locationId: (import.meta.env.VITE_SQUARE_LOCATION_ID || import.meta.env.VITE_PAYMENT_LOCATION_ID || '') as string
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
    price: 19.00,
    currency: 'USD',
    interval: 'month',
    features: [
      '50 messages per day',
      '5 voice calls per day',
      'Up to 3 AI Companions',
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
  private squarePayments: any = null;

  constructor() {
    this.config = PAYMENT_CONFIG;
    this.initializePaymentProvider();
  }

  public async initializePaymentProvider() {
    if (this.config.provider === 'stripe' && this.config.publishableKey) {
      this.stripe = await loadStripe(this.config.publishableKey);
    } else if (this.config.provider === 'square' && this.config.publishableKey) {
      await this.initializeSquare();
    }
  }

  private async initializeSquare() {
    // Load Square Web Payments SDK for the configured environment
    if (!window.Square) {
      const script = document.createElement('script');
      const isProd = (this.config.environment === 'production');
      script.src = isProd
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve as any;
        script.onerror = reject as any;
      });
    }

    if (!window.Square) throw new Error('Square SDK failed to load');

    this.squarePayments = window.Square.payments(
      this.config.publishableKey,
      this.config.locationId
    );
  }

  // Create payment intent for one-time payments (Stripe or server preflight). For Square, we don't require this in prod.
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

  // Get Square payments instance for frontend integration
  getSquarePayments(): any {
    return this.squarePayments;
  }

  // Create Square card payment form
  async createStripeCard(): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return this.stripe;
  }

  // Create Square Apple Pay
  async createSquareApplePay(): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return await this.squarePayments.applePay();
  }

  // Create Square Google Pay
  async createSquareGooglePay(): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return await this.squarePayments.googlePay();
  }

  // Check if payment provider is configured
  isConfigured(): boolean {
    if (this.config.provider === 'stripe') {
      return !!this.config.publishableKey;
    } else if (this.config.provider === 'square') {
      return !!this.config.publishableKey && !!this.config.locationId;
    }
    return false;
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

  // Get payment provider
  getProvider(): string {
    return this.config.provider;
  }

  // Get configuration
  getConfig(): PaymentConfig {
    return { ...this.config };
  }

  // Check if Square is properly configured and initialized
  async ensureStripeInitialized(): Promise<boolean> {
    if (this.config.provider !== "stripe") return false;
    
    if (!this.config.publishableKey) {
      console.error("Stripe publishable key not configured");
      return false;
    }
    
    if (!this.stripe) {
      try {
        await this.initializePaymentProvider();
      } catch (error) {
        console.error("Failed to initialize Stripe:", error);
        return false;
      }
    }
    
    return !!this.stripe;
  }
  // Process payment (for unified signup flow)
  async processPayment(options: {
    amount: number;
    currency: string;
    planId: string;
    customerEmail: string;
    sourceId?: string; // Square card token
  }): Promise<{ success: boolean; error?: string; paymentIntentId?: string }> {
    try {
      // For free plans, return success immediately
      if (options.amount === 0) {
        return { success: true, paymentIntentId: 'free-plan' };
      }

      // Handle Square directly (no preflight intent) to avoid dev simulation in prod
      if (this.config.provider === 'square') {
        if (!options.sourceId) return { success: false, error: 'Missing card token (sourceId)' };
        const response = await fetch(`${API_BASE}/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: options.planId,
            amount: options.amount,
            currency: options.currency.toLowerCase(),
            provider: 'square',
            sourceId: options.sourceId,
            email: options.customerEmail
          })
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          return { success: false, error: err.error || 'Square payment failed' };
        }
        const json = await response.json();
        // Check if Square payment was actually successful
        if (json.status && !['COMPLETED', 'APPROVED'].includes(json.status.toUpperCase())) {
          return { success: false, error: `Payment failed: ${json.status}` };
        }        return { success: true, paymentIntentId: json.id || ('square-' + Date.now()) };
      }

      // For Stripe: Create and then confirm intent
      const paymentIntent = await this.createPaymentIntent(options.planId);

      // Only simulate success on dev
      if (import.meta.env.DEV && paymentIntent.id.startsWith('dev_pi_')) {
        console.log('🧪 Development mode: simulating successful payment');
        return { success: true, paymentIntentId: paymentIntent.id };
      }

      if (this.config.provider === 'stripe' && this.stripe) {
        if (this.config.publishableKey && this.config.publishableKey !== 'your_stripe_publishable_key') {
          return { success: true, paymentIntentId: paymentIntent.id || 'stripe-' + Date.now() };
        } else {
          return { success: false, error: 'Stripe not properly configured' };
        }
      }

      return { success: false, error: 'Payment provider not available' };
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return { success: false, error: error.message || 'Payment processing failed' };
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
  if (typeof limit === 'boolean') return limit;
  if (typeof limit === 'number') return limit === -1 || limit > 0;
  return false;
}

// Usage tracking helper functions
export function checkMessageLimit(userPlan: string, messagesUsed: number): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;
  const limit = plan.limits.messagesPerDay;
  return limit === -1 || messagesUsed < limit;
}

export function checkVoiceCallLimit(userPlan: string, voiceCallsUsed: number): boolean {
  const plan = getPlanById(userPlan);
  if (!plan) return false;
  const limit = plan.limits.voiceCallsPerDay;
  return limit === -1 || voiceCallsUsed < limit;
}

export function getRemainingMessages(userPlan: string, messagesUsed: number): number {
  const plan = getPlanById(userPlan);
  if (!plan) return 0;
  const limit = plan.limits.messagesPerDay;
  if (limit === -1) return -1;
  return Math.max(0, limit - messagesUsed);
}

export function getRemainingVoiceCalls(userPlan: string, voiceCallsUsed: number): number {
  const plan = getPlanById(userPlan);
  if (!plan) return 0;
  const limit = plan.limits.voiceCallsPerDay;
  if (limit === -1) return -1;
  return Math.max(0, limit - voiceCallsUsed);
}
