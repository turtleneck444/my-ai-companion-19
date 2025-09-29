// Script to verify and fix premium status
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyPremiumStatus() {
  try {
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    console.log('🔍 Verifying Premium status for ogsbyoung@gmail.com...');
    console.log('');
    
    // Check user's current status
    console.log('1️⃣ Checking user profile...');
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId);
    
    if (userError) {
      console.error('❌ Error getting user data:', userError);
      return;
    }
    
    if (!userData || userData.length === 0) {
      console.log('❌ User not found in user_profiles');
      return;
    }
    
    const user = userData[0];
    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Plan:', user.subscription_plan_id);
    console.log('   Status:', user.subscription_status);
    console.log('   Voice calls used:', user.usage_voice_calls_today || 0);
    console.log('   Messages used:', user.usage_messages_today || 0);
    console.log('');
    
    // Check plan limits
    console.log('2️⃣ Checking plan limits...');
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', {
        user_uuid: userId
      });
    
    if (limitsError) {
      console.error('❌ Error checking limits:', limitsError);
      return;
    }
    
    console.log('📊 Plan limits result:');
    console.log('   Plan:', limitsData.plan);
    console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
    console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
    console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
    console.log('   Messages limit:', limitsData.limits.messagesPerDay);
    console.log('');
    
    // If user is premium but can't make voice calls, reset their usage
    if (user.subscription_plan_id === 'premium' && !limitsData.canMakeVoiceCall) {
      console.log('🔧 User is Premium but can\'t make voice calls. Resetting usage...');
      
      const { error: resetError } = await supabase
        .from('user_profiles')
        .update({
          usage_voice_calls_today: 0,
          usage_messages_today: 0,
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (resetError) {
        console.error('❌ Error resetting usage:', resetError);
        return;
      }
      
      console.log('✅ Usage reset successfully!');
      console.log('');
      
      // Test again
      console.log('3️⃣ Testing limits after reset...');
      const { data: newLimitsData, error: newLimitsError } = await supabase
        .rpc('check_user_plan_limits', {
          user_uuid: userId
        });
      
      if (newLimitsError) {
        console.error('❌ Error testing new limits:', newLimitsError);
        return;
      }
      
      console.log('📊 New limits:');
      console.log('   Can make voice call:', newLimitsData.canMakeVoiceCall);
      console.log('   Voice calls used:', newLimitsData.usage.voiceCallsUsed);
      console.log('   Voice calls limit:', newLimitsData.limits.voiceCallsPerDay);
      console.log('');
      
      if (newLimitsData.canMakeVoiceCall) {
        console.log('🎉 SUCCESS! User can now make voice calls!');
        console.log('📱 Tell ogsbyoung@gmail.com to refresh the page and try again');
      } else {
        console.log('❌ Still cannot make voice calls. There may be a deeper issue.');
      }
    } else if (user.subscription_plan_id === 'premium' && limitsData.canMakeVoiceCall) {
      console.log('✅ User is Premium and can make voice calls!');
      console.log('📱 Tell ogsbyoung@gmail.com to refresh the page');
    } else {
      console.log('❌ User is not Premium or there\'s an issue with the plan');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyPremiumStatus();
