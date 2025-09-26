import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UsageData {
  messagesUsed: number;
  voiceCallsUsed: number;
  companionsCreated: number;
}

interface PlanLimits {
  plan: string;
  limits: {
    messagesPerDay: number;
    voiceCallsPerDay: number;
    companions: number;
  };
  usage: UsageData;
  canSendMessage: boolean;
  canMakeVoiceCall: boolean;
}

export const useSupabaseUsageTracking = () => {
  const { user } = useAuth();
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load plan limits and usage from Supabase
  const loadPlanLimits = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call the Supabase function to get plan limits
      const { data, error: funcError } = await supabase.rpc('check_user_plan_limits', {
        user_uuid: user.id
      });

      if (funcError) {
        console.error('Error checking plan limits:', funcError);
        setError(funcError.message);
        return;
      }

      if (data) {
        setPlanLimits(data);
      }
    } catch (err) {
      console.error('Error loading plan limits:', err);
      setError('Failed to load plan limits');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Increment usage in Supabase
  const incrementUsage = useCallback(async (usageType: 'message' | 'voice_call' | 'companion'): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Call the Supabase function to increment usage
      const { data, error: funcError } = await supabase.rpc('increment_user_usage', {
        user_uuid: user.id,
        usage_type: usageType
      });

      if (funcError) {
        console.error('Error incrementing usage:', funcError);
        return false;
      }

      // If successful, reload the plan limits to get updated usage
      if (data) {
        await loadPlanLimits();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  }, [user?.id, loadPlanLimits]);

  // Convenience functions
  const incrementMessages = useCallback(() => incrementUsage('message'), [incrementUsage]);
  const incrementVoiceCalls = useCallback(() => incrementUsage('voice_call'), [incrementUsage]);
  const incrementCompanions = useCallback(() => incrementUsage('companion'), [incrementUsage]);

  // Load plan limits when user changes
  useEffect(() => {
    loadPlanLimits();
  }, [loadPlanLimits]);

  // Auto-refresh every 30 seconds to sync with database
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      loadPlanLimits();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, loadPlanLimits]);

  // Computed values for backward compatibility
  const usage: UsageData = planLimits?.usage || {
    messagesUsed: 0,
    voiceCallsUsed: 0,
    companionsCreated: 0
  };

  const currentPlan = planLimits?.plan || 'free';
  const canSendMessage = planLimits?.canSendMessage || false;
  const canMakeVoiceCall = planLimits?.canMakeVoiceCall || false;

  const remainingMessages = planLimits?.limits.messagesPerDay === -1 
    ? -1 // unlimited
    : Math.max(0, (planLimits?.limits.messagesPerDay || 0) - usage.messagesUsed);

  const remainingVoiceCalls = planLimits?.limits.voiceCallsPerDay === -1 
    ? -1 // unlimited  
    : Math.max(0, (planLimits?.limits.voiceCallsPerDay || 0) - usage.voiceCallsUsed);

  return {
    // Data
    usage,
    currentPlan,
    planLimits,
    isLoading,
    error,
    
    // Actions
    incrementMessages,
    incrementVoiceCalls, 
    incrementCompanions,
    refreshLimits: loadPlanLimits,
    
    // Computed values (for backward compatibility)
    canSendMessage,
    canMakeVoiceCall,
    remainingMessages,
    remainingVoiceCalls,
    
    // Convenience getters
    isUnlimited: currentPlan === 'pro',
    isPremium: currentPlan === 'premium' || currentPlan === 'pro',
    isFree: currentPlan === 'free'
  };
}; 