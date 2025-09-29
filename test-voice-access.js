// Test if Bonquisha voice is accessible
async function testVoiceAccess() {
  const voiceId = 'Qz1ptFvQEBIyY87QB6oV';
  const apiKey = process.env.VITE_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No ElevenLabs API key found');
    return;
  }
  
  try {
    console.log('🔍 Testing voice access for:', voiceId);
    
    // Test voice info endpoint
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    console.log('📡 Voice info response status:', voiceResponse.status);
    
    if (voiceResponse.ok) {
      const voiceData = await voiceResponse.json();
      console.log('✅ Voice found:', voiceData.name);
      console.log('🔧 Voice category:', voiceData.category);
      console.log('📝 Voice description:', voiceData.description);
    } else {
      const error = await voiceResponse.json();
      console.log('❌ Voice not accessible:', error);
    }
    
    // Test TTS endpoint
    console.log('\n🎤 Testing TTS with voice...');
    const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Hello, this is a test.',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.12,
          similarity_boost: 0.93,
          style: 0.85,
          use_speaker_boost: true
        }
      })
    });
    
    console.log('📡 TTS response status:', ttsResponse.status);
    
    if (ttsResponse.ok) {
      console.log('✅ TTS works! Voice is accessible');
    } else {
      const error = await ttsResponse.json();
      console.log('❌ TTS failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVoiceAccess();
