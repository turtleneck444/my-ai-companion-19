// Script to check all users in the database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fpzbbprrwdoidgnfxntz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemJicHJyd2RvaWRnbmZ4bnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTkzNDIsImV4cCI6MjA3NDQzNTM0Mn0.QI_2s5txsxfRV_3sijTgINZbYl0Fo5imBybbkpuD4z0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllUsers() {
  try {
    console.log('🔍 Checking all users in the database...');
    
    // Get all users with more details
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, preferred_name, usage_voice_calls_today, subscription_plan_id, created_at')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    console.log('📊 Found', users.length, 'users in the database:');
    console.log('');
    
    if (users.length === 0) {
      console.log('❌ No users found in the database');
      console.log('💡 This could mean:');
      console.log('   - The database is empty');
      console.log('   - There\'s a connection issue');
      console.log('   - The user_profiles table doesn\'t exist');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.preferred_name || 'Not set'}`);
      console.log(`   Voice calls: ${user.usage_voice_calls_today || 0}`);
      console.log(`   Plan: ${user.subscription_plan_id || 'free'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    // Check if ogsbyoung@gmail.com exists with different casing
    const ogsbyoung = users.find(user => 
      user.email.toLowerCase() === 'ogsbyoung@gmail.com'
    );
    
    if (ogsbyoung) {
      console.log('✅ Found ogsbyoung@gmail.com!');
      console.log('📊 Current voice calls:', ogsbyoung.usage_voice_calls_today || 0);
      
      // Add 20 voice calls
      const currentCalls = ogsbyoung.usage_voice_calls_today || 0;
      const newCalls = currentCalls + 20;
      
      console.log('➕ Adding 20 voice calls...');
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          usage_voice_calls_today: newCalls,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ogsbyoung.id);
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return;
      }
      
      console.log('✅ Successfully added 20 voice calls!');
      console.log('📊 User now has', newCalls, 'voice calls available');
      
    } else {
      console.log('❌ ogsbyoung@gmail.com not found in any form');
      console.log('💡 Available emails:');
      users.forEach(user => console.log('   -', user.email));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAllUsers();
