// Subscription Management Service
import { supabase } from './supabase';

export interface SubscriptionData {
  userId: string;
  planId: string;
  stripeCustomerId: string;
  stripeCardId: string;
}

export interface PaymentData {
  amount: number;
  currency: string;
  planId: string;
  customerEmail: string;
  sourceId: string;
}

class SubscriptionService {
  private apiBase = import.meta.env.DEV 
    ? 'http://localhost:3000/api' 
    : 'https://loveaicompanion.com/.netlify/functions';

  // Create subscription with payment processing (handles customer creation internally)
  async createSubscriptionWithPayment(subscriptionData: {
    userId: string;
    planId: string;
    customerEmail: string;
    customerName?: string;
    customerAge?: string;
    paymentMethodId: string;
  }): Promise<{ success: boolean; error?: string; subscriptionId?: string; customerId?: string; cardId?: string }> {
    try {
      const response = await fetch(`${this.apiBase}/payments/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: subscriptionData.planId,
          userId: subscriptionData.userId,
          customerEmail: subscriptionData.customerEmail,
          customerName: subscriptionData.customerName,
          customerAge: subscriptionData.customerAge,
          paymentMethodId: subscriptionData.paymentMethodId,
          provider: 'stripe'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error || 'Subscription creation failed' };
      }

      const result = await response.json();
      return { 
        success: true, 
        subscriptionId: result.subscriptionId,
        customerId: result.customerId,
        cardId: result.paymentMethodId
      };
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return { success: false, error: error.message || 'Subscription creation failed' };
    }
  }

  // Create subscription in database (legacy method - kept for compatibility)
  async createSubscription(subscriptionData: SubscriptionData): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_subscription', {
        p_user_id: subscriptionData.userId,
        p_plan_id: subscriptionData.planId,
        p_stripe_customer_id: subscriptionData.stripeCustomerId,
        p_stripe_card_id: subscriptionData.stripeCardId
      });

      if (error) {
        console.error('Subscription creation error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, subscriptionId: data };
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return { success: false, error: error.message || 'Subscription creation failed' };
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('cancel_subscription', {
        p_user_id: userId
      });

      if (error) {
        console.error('Subscription cancellation error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      return { success: false, error: error.message || 'Subscription cancellation failed' };
    }
  }

  // Get subscription status
  async getSubscriptionStatus(userId: string): Promise<{ status: string; planId: string; nextBillingDate?: string } | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_id, current_period_end')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Subscription status error:', error);
        return null;
      }

      return {
        status: data.status,
        planId: data.plan_id,
        nextBillingDate: data.current_period_end
      };
    } catch (error: any) {
      console.error('Subscription status error:', error);
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();
