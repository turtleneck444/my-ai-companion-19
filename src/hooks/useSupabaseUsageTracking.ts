import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getPlanById } from '@/lib/payments';

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

      // If not found by user_id, try by email
      if (error && error.code === 'PGRST116') {
        console.log('🔍 Debug: Not found by user_id, trying by email');
        const { data: emailData, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (emailError) {
          console.error('❌ Error loading profile by email:', emailError);
          setError(emailError.message);
          return;
        }
        profileData = emailData;
      } else if (error) {
        console.error('❌ Error loading profile by user_id:', error);
        setError(error.message);
        return;
      }

      console.log('🔍 Debug: Profile data:', profileData);

      if (!profileData) {
        console.log('🔍 Debug: No profile found, creating default');
        // Create a default profile
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            plan: 'free',
            messages_used: 0,
            voice_calls_used: 0,
            subscription_status: 'active'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          setError(createError.message);
          return;
        }
        profileData = newProfile;
      }

      // Get plan limits from payments.ts
      const plan = getPlanById(profileData.plan || 'free');
      const planLimits = {
        messagesPerDay: plan.limits.messages === -1 ? 9999 : plan.limits.messages,
        voiceCallsPerDay: plan.limits.voiceCalls === -1 ? 9999 : plan.limits.voiceCalls,
        companions: plan.limits.companions === -1 ? 9999 : plan.limits.companions
      };

      const usage: UsageData = {
        messagesUsed: profileData.messages_used || 0,
        voiceCallsUsed: profileData.voice_calls_used || 0,
        companionsCreated: 0 // This would need to be calculated from characters table
      };

      const canSendMessage = planLimits.messagesPerDay === 9999 || usage.messagesUsed < planLimits.messagesPerDay;
      const canMakeVoiceCall = planLimits.voiceCallsPerDay === 9999 || usage.voiceCallsUsed < planLimits.voiceCallsPerDay;

      const result: PlanLimits = {
        plan: profileData.plan || 'free',
        limits: planLimits,
        usage,
        canSendMessage,
        canMakeVoiceCall
      };

      console.log('🔍 Debug: Final plan limits:', result);
      setPlanLimits(result);

    } catch (err: any) {
      console.error('❌ Unexpected error loading plan limits:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPlanLimits();
  }, [loadPlanLimits]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadPlanLimits();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, loadPlanLimits]);

  const incrementUsage = useCallback(async (type: 'message' | 'voice_call') => {
    if (!user || !planLimits) return false;

    try {
      const column = type === 'message' ? 'messages_used' : 'voice_calls_used';
      const newCount = (type === 'message' ? planLimits.usage.messagesUsed : planLimits.usage.voiceCallsUsed) + 1;

      const { error } = await supabase
        .from('user_profiles')
        .update({ [column]: newCount, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error incrementing usage:', error);
        return false;
      }

      // Refresh the data
      await loadPlanLimits();
      return true;
    } catch (err) {
      console.error('❌ Unexpected error incrementing usage:', err);
      return false;
    }
  }, [user, planLimits, loadPlanLimits]);

  return {
    ...planLimits,
    isLoading,
    error,
    refresh: loadPlanLimits,
    incrementUsage
  };
};
