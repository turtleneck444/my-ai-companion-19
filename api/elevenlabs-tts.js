const https = require('https');
const { Readable } = require('stream');

// Enhanced ElevenLabs TTS API with better voice settings
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'audio/mpeg'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🎤 ElevenLabs TTS API called');
    
    // Parse request body
    const body = JSON.parse(event.body);
    const { text, voice_id, model_id, voice_settings } = body;
    
    console.log('📝 Request details:', {
      text: text?.slice(0, 50) + '...',
      voice_id,
      model_id,
      voice_settings
    });

    if (!text) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    // Enhanced voice settings for more natural speech
    const defaultVoiceSettings = {
      stability: 0.15,        // Lower for more natural variation
      similarity_boost: 0.98, // Higher for consistency
      style: 0.85,           // Higher for expressiveness
      use_speaker_boost: true
    };

    // Merge with provided settings
    const finalVoiceSettings = {
      ...defaultVoiceSettings,
      ...voice_settings
    };

    console.log('🔧 Final voice settings:', finalVoiceSettings);

    // ElevenLabs API configuration
    const voiceId = voice_id || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel
    const modelId = model_id || 'eleven_multilingual_v2';
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || '03c1fb7bb39fa7c890c0471cf1a79b93b96c3267b8ce41aa9e41162c7185a876';

    if (!apiKey) {
      console.error('❌ ElevenLabs API key not found');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'TTS service not configured' })
      };
    }

    // Enhanced text processing for better speech
    const processedText = processTextForSpeech(text);
    console.log('📝 Processed text:', processedText.slice(0, 100) + '...');

    // Make request to ElevenLabs
    const audioData = await makeElevenLabsRequest(processedText, voiceId, modelId, finalVoiceSettings, apiKey);
    
    console.log('✅ Audio generated successfully, size:', audioData.length);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Length': audioData.length.toString(),
        'Cache-Control': 'no-cache'
      },
      body: audioData.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('❌ TTS Error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'TTS generation failed',
        details: error.message 
      })
    };
  }
};

// Enhanced text processing for more natural speech
function processTextForSpeech(text) {
  let processed = text
    // Add natural pauses and emphasis
    .replace(/([.!?])\s+/g, '$1... ')
    // Add emphasis to important words
    .replace(/\b(amazing|incredible|wonderful|beautiful|love|adore|excited|happy|thrilled)\b/gi, '*$1*')
    // Add natural hesitations
    .replace(/\b(well|um|hmm|oh|wow|oh my)\b/gi, '$1...')
    // Add emotional expressions
    .replace(/\b(that's|that is)\b/gi, "that's")
    .replace(/\b(I'm|I am)\b/gi, "I'm")
    .replace(/\b(you're|you are)\b/gi, "you're")
    .replace(/\b(we're|we are)\b/gi, "we're")
    .replace(/\b(they're|they are)\b/gi, "they're");
  
  return processed;
}

// Make request to ElevenLabs API with enhanced settings
async function makeElevenLabsRequest(text, voiceId, modelId, voiceSettings, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: text,
      model_id: modelId,
      voice_settings: voiceSettings
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('🌐 Making ElevenLabs request:', {
      voiceId,
      modelId,
      voiceSettings,
      textLength: text.length
    });

    const req = https.request(options, (res) => {
      console.log('📡 ElevenLabs response status:', res.statusCode);
      
      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
          console.error('❌ ElevenLabs API error:', errorData);
          reject(new Error(`ElevenLabs API error: ${res.statusCode} - ${errorData}`));
        });
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const audioData = Buffer.concat(chunks);
        console.log('✅ Received audio data:', audioData.length, 'bytes');
        resolve(audioData);
      });

      res.on('error', (error) => {
        console.error('❌ Response error:', error);
        reject(error);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}
