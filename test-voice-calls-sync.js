// Test script to verify voice calls are syncing properly
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testVoiceCallsSync() {
  try {
    console.log('🧪 Testing voice calls sync...');
    console.log('');
    
    // Test the plan limits function that the app uses
    console.log('1️⃣ Testing check_user_plan_limits function...');
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', {
        user_uuid: userId
      });
    
    if (limitsError) {
      console.error('❌ Error testing plan limits:', limitsError);
      console.log('💡 This function is used by the app to check voice call limits');
      return;
    }
    
    console.log('✅ Plan limits function working!');
    console.log('📊 Results:');
    console.log('   Plan:', limitsData.plan);
    console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
    console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
    console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
    console.log('');
    
    // Test increment function
    console.log('2️⃣ Testing increment_user_usage function...');
    const { data: incrementResult, error: incrementError } = await supabase
      .rpc('increment_user_usage', {
        user_uuid: userId,
        usage_type: 'voice_call'
      });
    
    if (incrementError) {
      console.error('❌ Error testing increment:', incrementError);
    } else {
      console.log('✅ Increment function working!');
      console.log('📊 Can increment voice call:', incrementResult);
    }
    
    console.log('');
    console.log('🎉 Voice calls sync test complete!');
    console.log('🚀 The user should now be able to make voice calls at https://loveaicompanion.com');
    
    if (limitsData.canMakeVoiceCall) {
      console.log('✅ User can make voice calls - sync is working!');
    } else {
      console.log('❌ User cannot make voice calls - there may be a sync issue');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testVoiceCallsSync();
