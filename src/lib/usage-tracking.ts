import { supabase } from './supabase';

export const trackUsage = async (userId: string, type: 'messages' | 'voice_calls' | 'companions') => {
  try {
    const { error } = await supabase.rpc('increment_user_usage', {
      usage_type: type,
      user_uuid: userId
    });

    if (error) {
      console.error('Error tracking usage:', error);
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
};

export const getUsageStats = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('check_user_plan_limits', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error getting usage stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return null;
  }
}; 