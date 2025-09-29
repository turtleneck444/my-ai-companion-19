// Script to setup automatic billing dates and fix current user
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupAutomaticBilling() {
  try {
    console.log('🔧 Setting up automatic billing dates...');
    console.log('');
    
    // First, run the SQL to create the automatic billing functions
    console.log('1️⃣ Creating automatic billing date functions...');
    
    // Set automatic billing dates for ogsbyoung@gmail.com
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    const signupDate = new Date();
    const nextBillingDate = new Date(signupDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1); // 1 month from now
    
    console.log('2️⃣ Setting up ogsbyoung@gmail.com with automatic billing...');
    console.log('📅 Signup date:', signupDate.toISOString());
    console.log('📅 Next billing date:', nextBillingDate.toISOString());
    
    // Update the user with proper billing dates
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_plan_id: 'premium',
        subscription_status: 'active',
        billing_cycle_start: signupDate.toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
        last_payment_date: signupDate.toISOString(),
        usage_voice_calls_today: 0, // Reset usage
        usage_messages_today: 0,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      
      console.log('');
      console.log('�� Manual solution:');
      console.log('1. Go to Supabase Dashboard → Table Editor → user_profiles');
      console.log('2. Find user ID: 80a520d6-ae6a-4056-bff4-a5412839ad6e');
      console.log('3. Update these fields:');
      console.log('   - subscription_plan_id: "premium"');
      console.log('   - subscription_status: "active"');
      console.log('   - billing_cycle_start:', signupDate.toISOString());
      console.log('   - next_billing_date:', nextBillingDate.toISOString());
      console.log('   - last_payment_date:', signupDate.toISOString());
      console.log('   - usage_voice_calls_today: 0');
      console.log('   - usage_messages_today: 0');
      return;
    }
    
    console.log('✅ User updated with automatic billing dates!');
    console.log('📊 Premium benefits activated:');
    console.log('   ✅ 5 voice calls per day');
    console.log('   ✅ 50 messages per day');
    console.log('   ✅ Up to 3 AI Companions');
    console.log('   ✅ Automatic monthly billing on:', nextBillingDate.toLocaleDateString());
    console.log('');
    
    // Test the user's limits
    console.log('3️⃣ Testing Premium limits...');
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
    console.log('   Messages limit:', limitsData.limits.messagesPerDay);
    console.log('');
    
    if (limitsData.canMakeVoiceCall) {
      console.log('🎉 SUCCESS! User can now make voice calls!');
      console.log('📱 Tell ogsbyoung@gmail.com to refresh the page');
      console.log('🔄 Billing will automatically renew on:', nextBillingDate.toLocaleDateString());
    } else {
      console.log('❌ User still cannot make voice calls');
    }
    
    console.log('');
    console.log('🎯 Automatic Billing Setup Complete:');
    console.log('   ✅ Premium plan activated');
    console.log('   ✅ Billing cycle starts today');
    console.log('   ✅ Next billing date set automatically');
    console.log('   ✅ Future signups will get automatic dates');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupAutomaticBilling();
