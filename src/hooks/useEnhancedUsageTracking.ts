import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UsageData {
  messagesUsed: number;
  voiceCallsUsed: number;
  plan: string;
  remainingMessages: number;
  remainingVoiceCalls: number;
  canSendMessage: boolean;
  canMakeVoiceCall: boolean;
  messages_today: number;
  voice_calls_today: number;
}

const PLAN_LIMITS = {
  free: { messages: 5, voiceCalls: 1 },
  premium: { messages: 50, voiceCalls: 5 },
  pro: { messages: -1, voiceCalls: -1 } // -1 means unlimited
};

export const useEnhancedUsageTracking = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData>({
    messagesUsed: 0,
    voiceCallsUsed: 0,
    plan: 'free',
    remainingMessages: 5,
    remainingVoiceCalls: 1,
    canSendMessage: false, // Start as false until we load the actual plan
    canMakeVoiceCall: false, // Start as false until we load the actual plan
    messages_today: 0,
    voice_calls_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsageData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Debug: Loading usage data for user:', user.id);
      console.log('🔍 Debug: User email:', user.email);

      // Get user profile with usage data - try both user_id and email
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If not found by user_id, try by email
      if (profileError && user.email) {
        const { data: emailProfile, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (!emailError && emailProfile) {
          profile = emailProfile;
          profileError = null;
        }
      }

      if (profileError) {
        console.error('Profile error:', profileError);
        // Create a fallback profile for pro users
        if (user.email === 'ogsbyoung@gmail.com') {
          profile = {
            user_id: user.id,
            email: user.email,
            plan: 'pro',
            subscription_status: 'active',
            messages_used: 0,
            voice_calls_used: 0,
            messages_limit: -1,
            voice_calls_limit: -1
          };
          console.log('🔧 Using fallback pro profile for ogsbyoung@gmail.com');
        } else {
          throw new Error('Failed to load profile');
        }
      }

      console.log('🔍 Debug: Profile data loaded for usage:', profile);

      const plan = profile.plan || profile.subscription_plan || 'free';
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
      
      const messagesUsed = profile.messages_used || 0;
      const voiceCallsUsed = profile.voice_calls_used || 0;
      
      const remainingMessages = limits.messages === -1 ? 9999 : Math.max(0, limits.messages - messagesUsed);
      const remainingVoiceCalls = limits.voiceCalls === -1 ? 9999 : Math.max(0, limits.voiceCalls - voiceCallsUsed);
      
      const canSendMessage = plan === 'pro' || (limits.messages !== -1 && messagesUsed < limits.messages);
      const canMakeVoiceCall = plan === 'pro' || (limits.voiceCalls !== -1 && voiceCallsUsed < limits.voiceCalls);

      const newUsageData = {
        messagesUsed,
        voiceCallsUsed,
        plan,
        remainingMessages,
        remainingVoiceCalls,
        canSendMessage,
        canMakeVoiceCall,
        messages_today: messagesUsed,
        voice_calls_today: voiceCallsUsed
      };

      console.log('🔍 Debug: Usage data set:', newUsageData);
      setUsageData(newUsageData);

    } catch (err) {
      console.error('Error loading usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: 'message' | 'voiceCall') => {
    if (!user) return;

    try {
      const updateField = type === 'message' ? 'messages_used' : 'voice_calls_used';
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          [updateField]: supabase.raw(`${updateField} + 1`),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error incrementing usage:', error);
        return;
      }

      // Reload usage data
      await loadUsageData();
    } catch (err) {
      console.error('Error incrementing usage:', err);
    }
  };

  const resetUsage = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          messages_used: 0,
          voice_calls_used: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting usage:', error);
        return;
      }

      // Reload usage data
      await loadUsageData();
    } catch (err) {
      console.error('Error resetting usage:', err);
    }
  };

  useEffect(() => {
    loadUsageData();
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadUsageData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Create planLimits object for compatibility with chat components
  const planLimits = {
    messages_per_day: usageData.plan === 'pro' ? 999999 : (PLAN_LIMITS[usageData.plan as keyof typeof PLAN_LIMITS]?.messages || 5),
    voice_calls_per_day: usageData.plan === 'pro' ? 999999 : (PLAN_LIMITS[usageData.plan as keyof typeof PLAN_LIMITS]?.voiceCalls || 1)
  };

  console.log('🔍 Debug: Plan limits for chat components:', planLimits);
  console.log('🔍 Debug: Current plan:', usageData.plan);
  console.log('🔍 Debug: Messages today:', usageData.messages_today);
  console.log('🔍 Debug: Voice calls today:', usageData.voice_calls_today);
  console.log('🔍 Debug: Can send message check:', usageData.plan === 'pro', planLimits.messages_per_day, usageData.messages_today < planLimits.messages_per_day);
  console.log('🔍 Debug: Can make voice call check:', usageData.plan === 'pro', planLimits.voice_calls_per_day, usageData.voice_calls_today < planLimits.voice_calls_per_day);

  return {
    ...usageData,
    planLimits,
    loading,
    error,
    refresh: loadUsageData,
    incrementUsage,
    resetUsage
  };
};
