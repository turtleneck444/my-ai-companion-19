// Quick test to verify ElevenLabs API key is working
async function testElevenLabsAPI() {
  const apiKey = '03c1fb7bb39fa7c890c0471cf1a79b93b96c3267b8ce41aa9e41162c7185a876';
  
  try {
    console.log('🧪 Testing ElevenLabs API directly...');
    
    // Test user info to check credits
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ API Key works!');
      console.log('📊 Credits remaining:', userData.subscription?.character_count || 'Unknown');
      console.log('🔗 Character limit:', userData.subscription?.character_limit || 'Unknown');
    } else {
      console.log('❌ API Key failed:', userResponse.status);
    }
    
    // Test TTS with Rachel voice
    console.log('\n🎤 Testing TTS...');
    const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of the API key.',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.15,
          similarity_boost: 0.98,
          style: 0.85
        }
      })
    });
    
    console.log('�� TTS Response status:', ttsResponse.status);
    
    if (ttsResponse.ok) {
      console.log('✅ TTS works! API key is valid.');
    } else {
      const error = await ttsResponse.json();
      console.log('❌ TTS failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testElevenLabsAPI();
