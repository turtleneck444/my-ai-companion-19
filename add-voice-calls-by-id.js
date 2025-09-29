// Script to add 20 voice calls to user by ID
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addVoiceCallsByID(userId, voiceCallsToAdd = 20) {
  try {
    console.log(`🔍 Looking for user with ID: ${userId}...`);
    
    // Find the user by ID
    const { data: user, error: findError } = await supabase
      .from('user_profiles')
      .select('id, email, usage_voice_calls_today, subscription_plan_id')
      .eq('id', userId)
      .single();
    
    if (findError) {
      console.error('❌ Error finding user:', findError);
      return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('📊 Current voice calls:', user.usage_voice_calls_today || 0);
    console.log('📋 Current plan:', user.subscription_plan_id || 'free');
    
    // Add voice calls
    const currentCalls = user.usage_voice_calls_today || 0;
    const newCalls = currentCalls + voiceCallsToAdd;
    
    console.log(`➕ Adding ${voiceCallsToAdd} voice calls...`);
    
    // Update the user's voice call count
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        usage_voice_calls_today: newCalls,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }
    
    console.log('✅ Successfully added', voiceCallsToAdd, 'voice calls!');
    console.log('📊 User now has', newCalls, 'voice calls available');
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('email, usage_voice_calls_today, subscription_plan_id')
      .eq('id', userId)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('🎉 Final verification:');
    console.log('   Email:', verifyData.email);
    console.log('   Voice calls:', verifyData.usage_voice_calls_today);
    console.log('   Plan:', verifyData.subscription_plan_id);
    console.log('');
    console.log('🚀 The user can now make voice calls at https://loveaicompanion.com');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Use the provided user ID
const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
const voiceCalls = 20;

console.log(`🎯 Adding ${voiceCalls} voice calls to user ID: ${userId}`);
console.log('');

addVoiceCallsByID(userId, voiceCalls);
