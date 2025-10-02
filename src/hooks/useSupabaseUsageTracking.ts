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

const PLAN_LIMITS = {
  free: { messagesPerDay: 10, voiceCallsPerDay: 2, companions: 1 },
  premium: { messagesPerDay: 1000, voiceCallsPerDay: 100, companions: 10 },
  pro: { messagesPerDay: 10000, voiceCallsPerDay: 1000, companions: 50 }
};

export const useSupabaseUsageTracking = () => {
  const { user } = useAuth();
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load plan limits and usage directly from user_profiles table
  const loadPlanLimits = useCallback(async () => {
    if (!user?.id) return;

    console.log('🔍 Debug: Loading plan limits for user:', user.id);
    console.log('🔍 Debug: User email:', user.email);

    try {
      setIsLoading(true);
      setError(null);

      // First try to find by user_id
      let { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If not found by user_id, try to find by email
      if (error && error.code === 'PGRST116') {
        console.log('🔍 Debug: Not found by user_id, trying email');
        const emailResult = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (emailResult.data) {
          profileData = emailResult.data;
          error = null;
          console.log('🔍 Debug: Found by email:', profileData);
        } else {
          error = emailResult.error;
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading plan limits:', error);
        setError(error.message);
        return;
      }

      if (profileData) {
        console.log('🔍 Debug: Profile data loaded for plan limits:', profileData);
        
        const plan = profileData.plan || 'free';
        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const messagesUsed = profileData.usage_messages_today || 0;
        const voiceCallsUsed = profileData.usage_voice_calls_today || 0;
        const companionsCreated = profileData.usage_companions_created || 0;
        
        const remainingMessages = Math.max(0, limits.messagesPerDay - messagesUsed);
        const remainingVoiceCalls = Math.max(0, limits.voiceCallsPerDay - voiceCallsUsed);
        
        const planLimitsData: PlanLimits = {
          plan,
          limits,
          usage: {
            messagesUsed,
            voiceCallsUsed,
            companionsCreated
          },
          canSendMessage: remainingMessages > 0,
          canMakeVoiceCall: remainingVoiceCalls > 0
        };
        
        setPlanLimits(planLimitsData);
        
        console.log('🔍 Debug: Plan limits set:', planLimitsData);
      }
    } catch (error) {
      console.error('Error loading plan limits:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadPlanLimits();
  }, [loadPlanLimits]);

  // Calculate remaining counts
  const remainingMessages = planLimits?.limits.messagesPerDay === -1
    ? -1
    : Math.max(0, (planLimits?.limits.messagesPerDay || 0) - (planLimits?.usage.messagesUsed || 0));

  const remainingVoiceCalls = planLimits?.limits.voiceCallsPerDay === -1
    ? -1
    : Math.max(0, (planLimits?.limits.voiceCallsPerDay || 0) - (planLimits?.usage.voiceCallsUsed || 0));

  const remainingCompanions = planLimits?.limits.companions === -1
    ? -1
    : Math.max(0, (planLimits?.limits.companions || 0) - (planLimits?.usage.companionsCreated || 0));

  return {
    currentPlan: planLimits?.plan || 'free',
    planLimits,
    remainingMessages,
    remainingVoiceCalls,
    remainingCompanions,
    isLoading,
    error,
    loadPlanLimits
  };
};
