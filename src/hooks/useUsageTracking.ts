import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkMessageLimit, checkVoiceCallLimit, getRemainingMessages, getRemainingVoiceCalls } from '@/lib/payments';

interface UsageData {
  messagesUsed: number;
  voiceCallsUsed: number;
  lastResetDate: string;
}

export const useUsageTracking = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData>({
    messagesUsed: 0,
    voiceCallsUsed: 0,
    lastResetDate: new Date().toDateString()
  });
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  // Load usage data from localStorage
  useEffect(() => {
    if (user?.id) {
      const savedUsage = localStorage.getItem(`usage_${user.id}`);
      if (savedUsage) {
        const parsedUsage = JSON.parse(savedUsage);
        const today = new Date().toDateString();
        
        // Reset daily counters if it's a new day
        if (parsedUsage.lastResetDate !== today) {
          setUsage({
            messagesUsed: 0,
            voiceCallsUsed: 0,
            lastResetDate: today
          });
        } else {
          setUsage(parsedUsage);
        }
      }
    }
  }, [user?.id]);

  // Save usage data to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`usage_${user.id}`, JSON.stringify(usage));
    }
  }, [usage, user?.id]);

  const incrementMessages = () => {
    setUsage(prev => ({
      ...prev,
      messagesUsed: prev.messagesUsed + 1
    }));
  };

  const incrementVoiceCalls = () => {
    setUsage(prev => ({
      ...prev,
      voiceCallsUsed: prev.voiceCallsUsed + 1
    }));
  };

  const canSendMessage = checkMessageLimit(currentPlan, usage.messagesUsed);
  const canMakeVoiceCall = checkVoiceCallLimit(currentPlan, usage.voiceCallsUsed);
  const remainingMessages = getRemainingMessages(currentPlan, usage.messagesUsed);
  const remainingVoiceCalls = getRemainingVoiceCalls(currentPlan, usage.voiceCallsUsed);

  return {
    usage,
    currentPlan,
    setCurrentPlan,
    incrementMessages,
    incrementVoiceCalls,
    canSendMessage,
    canMakeVoiceCall,
    remainingMessages,
    remainingVoiceCalls
  };
};
