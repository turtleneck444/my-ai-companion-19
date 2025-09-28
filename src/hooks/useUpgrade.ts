import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { subscriptionService } from '@/lib/subscription-service';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

export interface UpgradeData {
  planId: string;
  paymentMethodId: string;
  customerEmail?: string;
  customerName?: string;
}

export const useUpgrade = () => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [limitType, setLimitType] = useState<'message' | 'voice_call' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has hit their limits and show upgrade prompt
  const checkLimitsAndPromptUpgrade = useCallback(async (usageType: 'message' | 'voice_call') => {
    if (!user?.id) return false;

    try {
      // Get current plan limits from Supabase
      const { data: planLimits, error } = await supabase.rpc('check_user_plan_limits', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error checking plan limits:', error);
        return false;
      }

      // Check if user has reached their limit
      const canUse = usageType === 'message' 
        ? planLimits?.canSendMessage 
        : planLimits?.canMakeVoiceCall;

      if (!canUse) {
        setLimitType(usageType);
        setShowUpgradePrompt(true);
        
        const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === planLimits?.plan);
        const suggestedPlan = currentPlan?.id === 'free' ? 'premium' : 'pro';
        
        toast({
          title: `${usageType === 'message' ? 'Daily message' : 'Daily voice call'} limit reached`,
          description: `You've reached your daily limit. Upgrade to ${suggestedPlan} to continue!`,
          variant: "destructive"
        });
        
        return true; // Limit reached
      }

      return false; // Can still use feature
    } catch (error) {
      console.error('Error checking limits:', error);
      return false;
    }
  }, [user?.id, toast]);

  // Create subscription with proper billing setup (simplified)
  const createSubscriptionWithBilling = async (upgradeData: UpgradeData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === upgradeData.planId);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    try {
      // Use the new simplified subscription creation
      const subscriptionResult = await subscriptionService.createSubscriptionWithPayment({
        userId: user.id,
        planId: plan.id,
        customerEmail: upgradeData.customerEmail || user.email || '',
        customerName: upgradeData.customerName,
        paymentMethodId: upgradeData.paymentMethodId
      });

      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.error || 'Subscription creation failed');
      }

      // Update user profile with new plan and billing info
      const billingStartDate = new Date();
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_plan_id: plan.id,
          subscription_status: 'active',
          subscription_plan: plan.id,
          customer_id: subscriptionResult.customerId,
          subscription_id: subscriptionResult.subscriptionId,
          billing_cycle_start: billingStartDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        subscriptionId: subscriptionResult.subscriptionId,
        nextBillingDate: nextBillingDate.toISOString()
      };
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw error;
    }
  };

  // Handle upgrade with full billing integration
  const handleUpgrade = async (upgradeData: UpgradeData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive"
      });
      return false;
    }

    setIsUpgrading(true);

    try {
      const result = await createSubscriptionWithBilling(upgradeData);
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === upgradeData.planId);
      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${plan?.name}! You'll be billed $${plan?.price} monthly starting ${new Date(result.nextBillingDate).toLocaleDateString()}.`,
      });

      setShowUpgradePrompt(false);
      setLimitType(null);
      return true;
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpgrading(false);
    }
  };

  // Simple plan upgrade without payment (for testing or free upgrades)
  const handleSimpleUpgrade = async (newPlan: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive"
      });
      return false;
    }

    setIsUpgrading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          subscription_plan_id: newPlan,
          subscription_status: 'active',
          subscription_plan: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      
      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${newPlan} plan! Your limits have been updated.`,
      });

      setShowUpgradePrompt(false);
      setLimitType(null);
      return true;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpgrading(false);
    }
  };

  return {
    isUpgrading,
    showUpgradePrompt,
    limitType,
    setShowUpgradePrompt,
    checkLimitsAndPromptUpgrade,
    handleUpgrade,
    handleSimpleUpgrade,
    createSubscriptionWithBilling
  };
};
