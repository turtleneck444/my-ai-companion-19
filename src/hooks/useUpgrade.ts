import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

export interface UpgradeData {
  planId: string;
  paymentMethodId?: string;
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
          description: `Upgrade to ${suggestedPlan} plan to continue unlimited conversations.`,
          variant: "destructive"
        });

        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking limits:', error);
      return false;
    }
  }, [user?.id, toast]);

  // Simplified upgrade handler - just shows the prompt
  const handleUpgrade = useCallback(async (upgradeData: UpgradeData) => {
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
      // The actual payment processing is now handled in the UpgradePrompt component
      // This function just validates the upgrade data
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === upgradeData.planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Update user profile with new plan (this will be done after successful payment)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_plan_id: plan.id,
          plan: plan.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${plan.name} plan! Your subscription is now active.`,
      });

      setShowUpgradePrompt(false);
      return true;
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || 'Something went wrong. Please try again.',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpgrading(false);
    }
  }, [user, toast]);

  // Show upgrade prompt
  const showUpgrade = useCallback((usageType: 'message' | 'voice_call') => {
    setLimitType(usageType);
    setShowUpgradePrompt(true);
  }, []);

  // Hide upgrade prompt
  const hideUpgrade = useCallback(() => {
    setShowUpgradePrompt(false);
    setLimitType(null);
  }, []);

  return {
    isUpgrading,
    showUpgradePrompt,
    limitType,
    checkLimitsAndPromptUpgrade,
    handleUpgrade,
    showUpgrade,
    hideUpgrade
  };
};
