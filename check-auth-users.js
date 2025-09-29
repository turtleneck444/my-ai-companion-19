// Script to check auth.users table and create user_profiles entry if needed
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAndCreateUserProfile() {
  try {
    const userId = "80a520d6-ae6a-4056-bff4-a5412839ad6e";
    
    console.log(`🔍 Checking auth.users for ID: ${userId}...`);
    
    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.log('❌ Error checking auth.users:', authError.message);
      
      // Try direct query to user_profiles
      console.log('🔍 Trying direct query to user_profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId);
      
      if (profileError) {
        console.error('❌ Error querying user_profiles:', profileError);
        return;
      }
      
      if (profileData && profileData.length > 0) {
        console.log('✅ Found user in user_profiles:', profileData[0].email);
        
        // Add voice calls
        const currentCalls = profileData[0].usage_voice_calls_today || 0;
        const newCalls = currentCalls + 20;
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            usage_voice_calls_today: newCalls,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          return;
        }
        
        console.log('✅ Successfully added 20 voice calls!');
        console.log('📊 User now has', newCalls, 'voice calls available');
        return;
      }
      
      console.log('❌ User not found in either table');
      return;
    }
    
    console.log('✅ Found user in auth.users:', authUser.user.email);
    
    // Check if user_profiles entry exists
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId);
    
    if (profileError) {
      console.error('❌ Error checking user_profiles:', profileError);
      return;
    }
    
    if (!profileData || profileData.length === 0) {
      console.log('📝 Creating user_profiles entry...');
      
      // Create user_profiles entry
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: authUser.user.email,
          preferred_name: authUser.user.user_metadata?.preferredName || '',
          subscription_plan_id: 'free',
          usage_voice_calls_today: 20, // Start with 20 voice calls
          usage_messages_today: 0,
          usage_companions_created: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('❌ Error creating user_profiles entry:', createError);
        return;
      }
      
      console.log('✅ Created user_profiles entry with 20 voice calls!');
      return;
    }
    
    // User exists in user_profiles, add voice calls
    const currentCalls = profileData[0].usage_voice_calls_today || 0;
    const newCalls = currentCalls + 20;
    
    console.log(`➕ Adding 20 voice calls (current: ${currentCalls}, new: ${newCalls})...`);
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        usage_voice_calls_today: newCalls,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }
    
    console.log('✅ Successfully added 20 voice calls!');
    console.log('📊 User now has', newCalls, 'voice calls available');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndCreateUserProfile();
