// Check ElevenLabs API usage and credits
async function checkElevenLabsUsage() {
  try {
    console.log('🔍 Checking ElevenLabs usage...');
    
    // Get API key from environment
    const apiKey = process.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('❌ ElevenLabs API key not found');
      return;
    }
    
    // Check user info and quota
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      console.log('❌ Failed to check ElevenLabs usage:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 ElevenLabs Account Info:');
    console.log('   Subscription tier:', data.subscription?.tier || 'Unknown');
    console.log('   Character count:', data.subscription?.character_count || 0);
    console.log('   Character limit:', data.subscription?.character_limit || 0);
    console.log('   Can extend character limit:', data.subscription?.can_extend_character_limit || false);
    console.log('   Can use instant voice cloning:', data.subscription?.can_use_instant_voice_cloning || false);
    console.log('   Can use professional voice cloning:', data.subscription?.can_use_professional_voice_cloning || false);
    console.log('   Voice limit:', data.subscription?.voice_limit || 0);
    console.log('   Professional voice limit:', data.subscription?.professional_voice_limit || 0);
    
    console.log('');
    console.log('💡 If you\'re hitting quota limits:');
    console.log('   1. Check your ElevenLabs dashboard');
    console.log('   2. Consider upgrading your ElevenLabs plan');
    console.log('   3. Or reduce voice message length');
    
  } catch (error) {
    console.error('❌ Error checking ElevenLabs usage:', error);
  }
}

checkElevenLabsUsage();
