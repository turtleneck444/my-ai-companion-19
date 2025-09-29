// Script to fix the free plan voice call limit mismatch
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixFreePlanVoiceCalls() {
  try {
    console.log('🔧 Fixing free plan voice call limits...');
    console.log('');
    
    // Update the free plan to allow 1 voice call per day (matching the code)
    console.log('1️⃣ Updating free plan limits...');
    const { data: updateData, error: updateError } = await supabase
      .from('plans')
      .update({
        limits: {
          messagesPerDay: 5,
          voiceCallsPerDay: 1, // Changed from 0 to 1
          companions: 1,
          customPersonalities: false,
          advancedFeatures: false,
          voiceChat: true // Changed from false to true
        }
      })
      .eq('id', 'free')
      .select();
    
    if (updateError) {
      console.error('❌ Error updating free plan:', updateError);
      return;
    }
    
    console.log('✅ Free plan updated successfully!');
    console.log('📊 New free plan limits:');
    console.log('   Messages per day: 5');
    console.log('   Voice calls per day: 1 (was 0)');
    console.log('   Companions: 1');
    console.log('   Voice chat: enabled');
    console.log('');
    
    // Test the user's limits now
    console.log('2️⃣ Testing user limits after fix...');
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', {
        user_uuid: userId
      });
    
    if (limitsError) {
      console.error('❌ Error testing limits:', limitsError);
      return;
    }
    
    console.log('✅ User limits test:');
    console.log('   Plan:', limitsData.plan);
    console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
    console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
    console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
    console.log('');
    
    if (limitsData.canMakeVoiceCall) {
      console.log('🎉 SUCCESS! User can now make voice calls!');
      console.log('🚀 The user can test voice calls at https://loveaicompanion.com');
    } else {
      console.log('❌ User still cannot make voice calls');
      console.log('💡 This might be because they already used their voice call for today');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixFreePlanVoiceCalls();
