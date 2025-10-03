import { supabase } from './supabase';
import { SUBSCRIPTION_PLANS } from './payments';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  subscription_plan: string;
  subscription_status: string;
  messages_used: number;
  voice_calls_used: number;
  messages_limit: number;
  voice_calls_limit: number;
  created_at: string;
  updated_at: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating user profile:', error);
    return false;
  }
};

export const upgradeUserPlan = async (userId: string, planId: string): Promise<boolean> => {
  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
  
  if (!plan) {
    console.error('Invalid plan ID:', planId);
    return false;
  }

  const updates = {
    subscription_plan: planId,
    subscription_status: 'active',
    messages_limit: plan.limits.messages,
    voice_calls_limit: plan.limits.voiceCalls
  };

  return await updateUserProfile(userId, updates);
};

export const incrementUsage = async (userId: string, type: 'message' | 'voiceCall'): Promise<boolean> => {
  try {
    const field = type === 'message' ? 'messages_used' : 'voice_calls_used';
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        [field]: supabase.raw(`${field} + 1`),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error incrementing usage:', error);
    return false;
  }
};

export const resetUsage = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        messages_used: 0,
        voice_calls_used: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error resetting usage:', error);
    return false;
  }
};
