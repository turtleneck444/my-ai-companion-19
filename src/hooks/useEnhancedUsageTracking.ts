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
    canSendMessage: true,
    canMakeVoiceCall: true
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

      // Get user profile with usage data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to load profile');
      }

      console.log('🔍 Debug: Profile data loaded for usage:', profile);

      const plan = profile.subscription_plan || 'free';
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
      
      const messagesUsed = profile.messages_used || 0;
      const voiceCallsUsed = profile.voice_calls_used || 0;
      
      const remainingMessages = limits.messages === -1 ? 9999 : Math.max(0, limits.messages - messagesUsed);
      const remainingVoiceCalls = limits.voiceCalls === -1 ? 9999 : Math.max(0, limits.voiceCalls - voiceCallsUsed);
      
      const canSendMessage = limits.messages === -1 || messagesUsed < limits.messages;
      const canMakeVoiceCall = limits.voiceCalls === -1 || voiceCallsUsed < limits.voiceCalls;

      const newUsageData = {
        messagesUsed,
        voiceCallsUsed,
        plan,
        remainingMessages,
        remainingVoiceCalls,
        canSendMessage,
        canMakeVoiceCall
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

  return {
    ...usageData,
    loading,
    error,
    refresh: loadUsageData,
    incrementUsage,
    resetUsage
  };
};
