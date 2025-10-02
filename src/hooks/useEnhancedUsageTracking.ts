import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpgrade } from './useUpgrade';
import { supabase } from '@/lib/supabase';

interface UsageData {
  messagesUsed: number;
  voiceCallsUsed: number;
  lastResetDate: string;
  plan: string;
  canSendMessage: boolean;
  canMakeVoiceCall: boolean;
  remainingMessages: number;
  remainingVoiceCalls: number;
}

const PLAN_LIMITS = {
  free: { messages: 10, voiceCalls: 2 },
  premium: { messages: 1000, voiceCalls: 100 },
  pro: { messages: 10000, voiceCalls: 1000 }
};

export const useEnhancedUsageTracking = () => {
  const { user } = useAuth();
  const { checkLimitsAndPromptUpgrade, showUpgradePrompt, handleUpgrade, isUpgrading, hideUpgrade } = useUpgrade();
  const [usage, setUsage] = useState<UsageData>({
    messagesUsed: 0,
    voiceCallsUsed: 0,
    lastResetDate: new Date().toDateString(),
    plan: 'free',
    canSendMessage: true,
    canMakeVoiceCall: true,
    remainingMessages: 5,
    remainingVoiceCalls: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load usage data directly from user_profiles table
  const loadUsageData = useCallback(async () => {
    if (!user?.id) return;

    console.log('🔍 Debug: Loading usage data for user:', user.id);
    console.log('🔍 Debug: User email:', user.email);

    try {
      setIsLoading(true);
      
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
        console.error('Error loading usage data:', error);
        return;
      }

      if (profileData) {
        console.log('🔍 Debug: Profile data loaded for usage:', profileData);
        
        const plan = profileData.plan || 'free';
        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
        const messagesUsed = profileData.usage_messages_today || 0;
        const voiceCallsUsed = profileData.usage_voice_calls_today || 0;
        
        const remainingMessages = Math.max(0, limits.messages - messagesUsed);
        const remainingVoiceCalls = Math.max(0, limits.voiceCalls - voiceCallsUsed);
        
        setUsage({
          messagesUsed,
          voiceCallsUsed,
          lastResetDate: new Date().toDateString(),
          plan,
          canSendMessage: remainingMessages > 0,
          canMakeVoiceCall: remainingVoiceCalls > 0,
          remainingMessages,
          remainingVoiceCalls
        });
        
        console.log('🔍 Debug: Usage data set:', {
          messagesUsed,
          voiceCallsUsed,
          plan,
          remainingMessages,
          remainingVoiceCalls
        });
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Increment message usage
  const incrementMessages = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    // Check if user can send message before incrementing
    if (!usage.canSendMessage) {
      await checkLimitsAndPromptUpgrade('message');
      return false;
    }

    try {
      // Update usage directly in user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update({
          usage_messages_today: (usage.messagesUsed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error incrementing message usage:', error);
        return false;
      }

      // Reload usage data to get updated limits
      await loadUsageData();
      return true;
    } catch (error) {
      console.error('Error incrementing message usage:', error);
      return false;
    }
  }, [user?.id, usage.canSendMessage, usage.messagesUsed, loadUsageData, checkLimitsAndPromptUpgrade]);

  // Increment voice call usage
  const incrementVoiceCalls = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    // Check if user can make voice call before incrementing
    if (!usage.canMakeVoiceCall) {
      await checkLimitsAndPromptUpgrade('voice_call');
      return false;
    }

    try {
      // Update usage directly in user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update({
          usage_voice_calls_today: (usage.voiceCallsUsed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error incrementing voice call usage:', error);
        return false;
      }

      // Reload usage data to get updated limits
      await loadUsageData();
      return true;
    } catch (error) {
      console.error('Error incrementing voice call usage:', error);
      return false;
    }
  }, [user?.id, usage.canMakeVoiceCall, usage.voiceCallsUsed, loadUsageData, checkLimitsAndPromptUpgrade]);

  // Reset daily usage (for testing or admin purposes)
  const resetDailyUsage = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          usage_messages_today: 0,
          usage_voice_calls_today: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting daily usage:', error);
        return false;
      }

      // Reload usage data
      await loadUsageData();
      return true;
    } catch (error) {
      console.error('Error resetting daily usage:', error);
      return false;
    }
  }, [user?.id, loadUsageData]);

  return {
    usage,
    isLoading,
    incrementMessages,
    incrementVoiceCalls,
    resetDailyUsage,
    loadUsageData,
    showUpgradePrompt,
    handleUpgrade,
    isUpgrading,
    hideUpgrade
  };
};
