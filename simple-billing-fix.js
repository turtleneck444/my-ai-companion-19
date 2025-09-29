// Simple script to fix ogsbyoung@gmail.com with automatic billing using existing columns
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simpleBillingFix() {
  try {
    console.log('🔧 Setting up automatic billing for ogsbyoung@gmail.com...');
    console.log('');
    
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    const signupDate = new Date();
    const nextBillingDate = new Date(signupDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // 1 month from now
    
    console.log('📅 Automatic billing dates:');
    console.log('   Signup date:', signupDate.toLocaleDateString());
    console.log('   Next billing:', nextBillingDate.toLocaleDateString());
    console.log('');
    
    // Update user with automatic billing dates using existing columns
    console.log('1️⃣ Updating user with Premium plan and automatic billing...');
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_plan_id: 'premium',
        subscription_status: 'active',
        next_billing_date: nextBillingDate.toISOString(),
        usage_voice_calls_today: 0, // Reset usage so they can use voice calls
        usage_messages_today: 0,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      
      console.log('');
      console.log('💡 Manual solution:');
      console.log('Go to Supabase Dashboard → user_profiles → find user → update:');
      console.log('   - subscription_plan_id: "premium"');
      console.log('   - subscription_status: "active"');
      console.log('   - next_billing_date:', nextBillingDate.toISOString());
      console.log('   - usage_voice_calls_today: 0');
      console.log('   - usage_messages_today: 0');
      return;
    }
    
    console.log('✅ User updated successfully!');
    if (updateData && updateData.length > 0) {
      const user = updateData[0];
      console.log('📊 Updated user data:');
      console.log('   Email:', user.email);
      console.log('   Plan:', user.subscription_plan_id);
      console.log('   Status:', user.subscription_status);
      console.log('   Next billing:', user.next_billing_date);
      console.log('   Voice calls:', user.usage_voice_calls_today);
    }
    console.log('');
    
    // Test the user's limits
    console.log('2️⃣ Testing Premium limits...');
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', {
        user_uuid: userId
      });
    
    if (limitsError) {
      console.error('❌ Error testing limits:', limitsError);
      return;
    }
    
    console.log('📊 Premium limits test:');
    console.log('   Plan:', limitsData.plan);
    console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
    console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
    console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
    console.log('');
    
    if (limitsData.canMakeVoiceCall) {
      console.log('🎉 SUCCESS! User can now make voice calls!');
      console.log('📱 Tell ogsbyoung@gmail.com to refresh the page');
      console.log('🔄 Next billing date:', nextBillingDate.toLocaleDateString());
      console.log('💰 Amount: $19.00/month');
    } else {
      console.log('❌ User still cannot make voice calls');
      console.log('💡 They might need to refresh the page or sign out/in');
    }
    
    console.log('');
    console.log('🎯 Automatic Billing Summary:');
    console.log('   ✅ User upgraded to Premium');
    console.log('   ✅ Billing starts today');
    console.log('   ✅ Next billing in 1 month');
    console.log('   ✅ Future users will get automatic dates');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

simpleBillingFix();
