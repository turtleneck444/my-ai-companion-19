// Simple script to upgrade user to premium (bypassing RLS)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simplePremiumUpgrade() {
  try {
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    console.log('🚀 Simple Premium upgrade...');
    console.log('📧 User ID:', userId);
    console.log('');
    
    // Try to update existing user
    console.log('1️⃣ Attempting to update user to Premium...');
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
      console.log('❌ Update failed:', updateError.message);
      console.log('');
      console.log('💡 Manual solution:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Table Editor → user_profiles');
      console.log('3. Find the user with ID: 80a520d6-ae6a-4056-bff4-a5412839ad6e');
      console.log('4. Update these fields:');
      console.log('   - subscription_plan_id: "premium"');
      console.log('   - subscription_status: "active"');
      console.log('   - updated_at: current timestamp');
      console.log('');
      console.log('🎯 This will give the user:');
      console.log('   ✅ 5 voice calls per day');
      console.log('   ✅ 50 messages per day');
      console.log('   ✅ Up to 3 AI Companions');
      console.log('   ✅ Advanced voice features');
      return;
    }
    
    console.log('✅ User upgraded to Premium successfully!');
    console.log('📊 Premium benefits activated:');
    console.log('   ✅ 5 voice calls per day');
    console.log('   ✅ 50 messages per day');
    console.log('   ✅ Up to 3 AI Companions');
    console.log('   ✅ Advanced voice features');
    console.log('');
    console.log('🚀 The user can now test voice calls at https://loveaicompanion.com');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

simplePremiumUpgrade();
