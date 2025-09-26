// Subscription Management Service
import { supabase } from './supabase';

export interface SubscriptionData {
  userId: string;
  planId: string;
  squareCustomerId: string;
  squareCardId: string;
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

  // Process real payment with Square
  async processPayment(paymentData: PaymentData): Promise<{ success: boolean; error?: string; paymentId?: string }> {
    try {
      const response = await fetch(`${this.apiBase}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          provider: 'square'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error || 'Payment failed' };
      }

      const result = await response.json();
      return { success: true, paymentId: result.id };
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return { success: false, error: error.message || 'Payment processing failed' };
    }
  }

  // Create customer and save card for future billing
  async createCustomer(email: string, sourceId: string, planId: string): Promise<{ success: boolean; error?: string; customerId?: string; cardId?: string }> {
    try {
      const response = await fetch(`${this.apiBase}/payments/create-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          sourceId,
          planId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.error || 'Customer creation failed' };
      }

      const result = await response.json();
      return { 
        success: true, 
        customerId: result.customerId, 
        cardId: result.cardId 
      };
    } catch (error: any) {
      console.error('Customer creation error:', error);
      return { success: false, error: error.message || 'Customer creation failed' };
    }
  }

  // Create subscription in database
  async createSubscription(subscriptionData: SubscriptionData): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_subscription', {
        p_user_id: subscriptionData.userId,
        p_plan_id: subscriptionData.planId,
        p_square_customer_id: subscriptionData.squareCustomerId,
        p_square_card_id: subscriptionData.squareCardId
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
