import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const useUpgrade = () => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const updateSubscriptionInSupabase = async (newPlan: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          subscription_plan: newPlan,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to update subscription in Supabase:', error);
      throw error;
    }
  };

  const handleUpgrade = async (newPlan: string) => {
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
      await updateSubscriptionInSupabase(newPlan);
      
      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${newPlan} plan! Your limits have been updated.`,
      });

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
    handleUpgrade,
    updateSubscriptionInSupabase
  };
};
