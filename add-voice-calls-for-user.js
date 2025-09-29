// Script to add 20 voice calls to any user by email
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addVoiceCallsToUser(email, voiceCallsToAdd = 20) {
  try {
    console.log(`🔍 Looking for user ${email}...`);
    
    // Find the user by email
    const { data: user, error: findError } = await supabase
      .from('user_profiles')
      .select('id, email, usage_voice_calls_today, subscription_plan_id')
      .eq('email', email)
      .single();
    
    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log(`❌ User ${email} not found. They need to sign up first at https://loveaicompanion.com`);
        console.log(`💡 Once they sign up, run this script again to add voice calls`);
        return;
      }
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
      .eq('id', user.id)
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
      .eq('email', email)
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

// Get email from command line argument or use default
const email = process.argv[2] || 'ogsbyoung@gmail.com';
const voiceCalls = parseInt(process.argv[3]) || 20;

console.log(`🎯 Adding ${voiceCalls} voice calls to ${email}`);
console.log('');

addVoiceCallsToUser(email, voiceCalls);
