// Script to upgrade ogsbyoung@gmail.com to premium user
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function upgradeToPremium() {
  try {
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    console.log('�� Upgrading user to Premium plan...');
    console.log('📧 User ID:', userId);
    console.log('');
    
    // First, let's check if the user exists
    console.log('1️⃣ Checking if user exists...');
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, subscription_plan_id')
      .eq('id', userId);
    
    if (userError) {
      console.error('❌ Error finding user:', userError);
      return;
    }
    
    if (!userData || userData.length === 0) {
      console.log('❌ User not found. Creating user profile...');
      
      // Create user profile
      const { data: createData, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: 'ogsbyoung@gmail.com',
          subscription_plan_id: 'premium',
          subscription_status: 'active',
          usage_voice_calls_today: 0,
          usage_messages_today: 0,
          usage_companions_created: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .select();
      
      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        return;
      }
      
      console.log('✅ User profile created with Premium plan!');
    } else {
      console.log('✅ User found:', userData[0].email);
      console.log('📋 Current plan:', userData[0].subscription_plan_id || 'free');
      
      // Update user to premium
      console.log('2️⃣ Upgrading to Premium plan...');
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_plan_id: 'premium',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
      
      if (updateError) {
        console.error('❌ Error upgrading user:', updateError);
        return;
      }
      
      console.log('✅ User upgraded to Premium plan!');
    }
    
    // Test the user's new limits
    console.log('');
    console.log('3️⃣ Testing new Premium limits...');
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('check_user_plan_limits', {
        user_uuid: userId
      });
    
    if (limitsError) {
      console.error('❌ Error testing limits:', limitsError);
      return;
    }
    
    console.log('✅ Premium plan limits:');
    console.log('   Plan:', limitsData.plan);
    console.log('   Can make voice call:', limitsData.canMakeVoiceCall);
    console.log('   Voice calls used:', limitsData.usage.voiceCallsUsed);
    console.log('   Voice calls limit:', limitsData.limits.voiceCallsPerDay);
    console.log('   Messages limit:', limitsData.limits.messagesPerDay);
    console.log('   Companions limit:', limitsData.limits.companions);
    console.log('');
    
    if (limitsData.canMakeVoiceCall) {
      console.log('🎉 SUCCESS! User is now Premium and can make voice calls!');
      console.log('📊 Premium benefits:');
      console.log('   ✅ 5 voice calls per day');
      console.log('   ✅ 50 messages per day');
      console.log('   ✅ Up to 3 AI Companions');
      console.log('   ✅ Custom personality creation');
      console.log('   ✅ Advanced voice features');
      console.log('');
      console.log('🚀 The user can now test voice calls at https://loveaicompanion.com');
    } else {
      console.log('❌ User still cannot make voice calls');
      console.log('💡 This might be because they already used their voice calls for today');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

upgradeToPremium();
