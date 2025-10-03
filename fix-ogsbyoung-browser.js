// Run this in the browser console when logged in as ogsbyoung@gmail.com
// This will fix the user profile to have pro plan with unlimited messages and calls

async function fixOgsbyoungProfile() {
  try {
    console.log('🔍 Fixing ogsbyoung@gmail.com profile...');
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not logged in or auth error:', authError);
      return;
    }
    
    console.log('✅ User logged in:', user.email);
    
    // Update the user profile to pro plan
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        messages_used: 0,
        voice_calls_used: 0,
        messages_limit: -1, // Unlimited
        voice_calls_limit: -1, // Unlimited
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }
    
    console.log('✅ Profile updated successfully:', updatedProfile);
    console.log('🎉 ogsbyoung@gmail.com profile fixed! You should now have unlimited messages and calls.');
    
    // Refresh the page to see changes
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixOgsbyoungProfile();
