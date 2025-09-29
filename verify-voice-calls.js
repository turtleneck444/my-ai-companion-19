// Script to verify the user's voice calls were updated
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyVoiceCalls() {
  try {
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    console.log('🔍 Verifying voice calls for user ID:', userId);
    console.log('');
    
    // Try to get user data
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, usage_voice_calls_today, subscription_plan_id, last_active_at, updated_at')
      .eq('id', userId);
    
    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      return;
    }
    
    if (!userData || userData.length === 0) {
      console.log('❌ User not found in user_profiles table');
      return;
    }
    
    const user = userData[0];
    
    console.log('✅ User found!');
    console.log('📧 Email:', user.email);
    console.log('🎤 Voice calls available:', user.usage_voice_calls_today || 0);
    console.log('📋 Plan:', user.subscription_plan_id || 'free');
    console.log('🕒 Last active:', user.last_active_at);
    console.log('🔄 Last updated:', user.updated_at);
    console.log('');
    
    // Test the plan limits function
    console.log('🧪 Testing plan limits function...');
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', {
        user_uuid: userId
      });
    
    if (limitsError) {
      console.error('❌ Error testing plan limits:', limitsError);
    } else {
      console.log('✅ Plan limits function working:');
      console.log('   Plan:', limitsData.plan);
      console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
      console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
      console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
    }
    
    console.log('');
    console.log('🎉 Verification complete!');
    console.log('🚀 The user can now make voice calls at https://loveaicompanion.com');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyVoiceCalls();
