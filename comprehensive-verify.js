// Comprehensive verification script
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function comprehensiveVerify() {
  try {
    console.log('🔍 Comprehensive verification of voice calls...');
    console.log('');
    
    // Check connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection error:', testError);
      return;
    }
    
    console.log('✅ Supabase connection working');
    console.log('');
    
    // Check all users
    console.log('2️⃣ Checking all users in user_profiles...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('user_profiles')
      .select('id, email, usage_voice_calls_today')
      .limit(10);
    
    if (allUsersError) {
      console.error('❌ Error getting all users:', allUsersError);
    } else {
      console.log(`📊 Found ${allUsers.length} users:`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}) - Voice calls: ${user.usage_voice_calls_today || 0}`);
      });
      console.log('');
    }
    
    // Check specific user
    console.log('3️⃣ Checking specific user...');
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    const { data: specificUser, error: specificError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId);
    
    if (specificError) {
      console.error('❌ Error getting specific user:', specificError);
    } else if (specificUser && specificUser.length > 0) {
      const user = specificUser[0];
      console.log('✅ User found:');
      console.log('   Email:', user.email);
      console.log('   Voice calls:', user.usage_voice_calls_today || 0);
      console.log('   Plan:', user.subscription_plan_id || 'free');
      console.log('   Last active:', user.last_active_at);
      console.log('');
      
      // Test plan limits
      console.log('4️⃣ Testing plan limits function...');
      const { data: limitsData, error: limitsError } = await supabase
        .rpc('check_user_plan_limits', {
          user_uuid: userId
        });
      
      if (limitsError) {
        console.error('❌ Plan limits error:', limitsError);
      } else {
        console.log('✅ Plan limits working:');
        console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
        console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
        console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
      }
      
    } else {
      console.log('❌ Specific user not found');
    }
    
    console.log('');
    console.log('🎯 Summary:');
    console.log('   - Connection: ✅ Working');
    console.log('   - User lookup: ' + (specificUser && specificUser.length > 0 ? '✅ Found' : '❌ Not found'));
    console.log('   - Voice calls: ' + (specificUser && specificUser.length > 0 ? `${specificUser[0].usage_voice_calls_today || 0} available` : 'Unknown'));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

comprehensiveVerify();
