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

export const useEnhancedUsageTracking = () => {
  const { user } = useAuth();
  const { checkLimitsAndPromptUpgrade } = useUpgrade();
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

  // Load usage data from Supabase
  const loadUsageData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      const { data: planLimits, error } = await supabase.rpc('check_user_plan_limits', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error loading usage data:', error);
        return;
      }

      if (planLimits) {
        setUsage({
          messagesUsed: planLimits.messagesUsed || 0,
          voiceCallsUsed: planLimits.voiceCallsUsed || 0,
          lastResetDate: new Date().toDateString(),
          plan: planLimits.plan || 'free',
          canSendMessage: planLimits.canSendMessage || false,
          canMakeVoiceCall: planLimits.canMakeVoiceCall || false,
          remainingMessages: planLimits.remainingMessages || 0,
          remainingVoiceCalls: planLimits.remainingVoiceCalls || 0
        });
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Increment message usage with automatic limit checking
  const incrementMessages = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    // Check if user can send message before incrementing
    if (!usage.canSendMessage) {
      await checkLimitsAndPromptUpgrade('message');
      return false;
    }

    try {
      const { data: success, error } = await supabase.rpc('increment_user_usage', {
        user_uuid: user.id,
        usage_type: 'message'
      });

      if (error) {
        console.error('Error incrementing message usage:', error);
        return false;
      }

      if (success) {
        // Reload usage data to get updated limits
        await loadUsageData();
        return true;
      }

      // If increment failed due to limits, show upgrade prompt
      await checkLimitsAndPromptUpgrade('message');
      return false;
    } catch (error) {
      console.error('Error incrementing message usage:', error);
      return false;
    }
  }, [user?.id, usage.canSendMessage, checkLimitsAndPromptUpgrade, loadUsageData]);

  // Increment voice call usage with automatic limit checking
  const incrementVoiceCalls = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    // Check if user can make voice call before incrementing
    if (!usage.canMakeVoiceCall) {
      await checkLimitsAndPromptUpgrade('voice_call');
      return false;
    }

    try {
      const { data: success, error } = await supabase.rpc('increment_user_usage', {
        user_uuid: user.id,
        usage_type: 'voice_call'
      });

      if (error) {
        console.error('Error incrementing voice call usage:', error);
        return false;
      }

      if (success) {
        // Reload usage data to get updated limits
        await loadUsageData();
        return true;
      }

      // If increment failed due to limits, show upgrade prompt
      await checkLimitsAndPromptUpgrade('voice_call');
      return false;
    } catch (error) {
      console.error('Error incrementing voice call usage:', error);
      return false;
    }
  }, [user?.id, usage.canMakeVoiceCall, checkLimitsAndPromptUpgrade, loadUsageData]);

  return {
    usage,
    isLoading,
    incrementMessages,
    incrementVoiceCalls,
    loadUsageData
  };
}; 