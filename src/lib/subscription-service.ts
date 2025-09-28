import { supabase } from '../integrations/supabase/client';

export interface SubscriptionData {
  userId: string;
  planId: string;
  customerEmail: string;
  customerName?: string;
  paymentMethodId: string;
  stripeCustomerId?: string;
  stripeCardId?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  customerId?: string;
  error?: string;
}

export class SubscriptionService {
  async createSubscriptionWithPayment(data: {
    userId: string;
    planId: string;
    customerEmail: string;
    customerName?: string;
    paymentMethodId: string;
  }): Promise<SubscriptionResult> {
    if (!data.paymentMethodId) {
      throw new Error('Payment method required for subscription');
    }

    try {
      const response = await fetch('/.netlify/functions/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: data.planId,
          paymentMethodId: data.paymentMethodId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          provider: 'stripe'
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Subscription creation failed');
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          subscriptionId: result.subscription.id,
          customerId: result.subscription.customerId
        };
      } else {
        throw new Error(result.error || 'Subscription creation failed');
      }
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      throw new Error(error.message || 'Subscription creation failed');
    }
  }

  async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('cancel_subscription', {
        p_user_id: userId
      });

      if (error) {
        console.error('Subscription cancellation error:', error);
        throw new Error(error.message || 'Subscription cancellation failed');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Subscription cancellation error:', error);
      return { 
        success: false, 
        error: error.message || 'Subscription cancellation failed' 
      };
    }
  }

  async getSubscriptionStatus(userId: string): Promise<{ status: string; planId: string; nextBillingDate?: string } | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_plan_id, subscription_status, next_billing_date')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription status:', error);
        return null;
      }

      return {
        status: data.subscription_status || 'inactive',
        planId: data.subscription_plan_id || 'free',
        nextBillingDate: data.next_billing_date
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();
