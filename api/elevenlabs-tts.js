const https = require('https');
const { Readable } = require('stream');

// Enhanced ElevenLabs TTS API with FEMALE VOICES ONLY
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

    // FEMALE VOICE VALIDATION - Only allow confirmed female voices
    const FEMALE_VOICES = [
      'EXAVITQu4vr4xnSDxMaL', // Luna (Sarah) - professional female
      '21m00Tcm4TlvDq8ikWAM', // Bonquisha (Rachel) - bold female
      'AZnzlk1XvdvUeBnXmlld', // Bella - seductive female
      'ErXwobaYiN019PkySvjV', // Elli - soft female
      'pNInz6obpgDQGcFmaJgB', // Olivia - cheerful female
      'onwK4e9ZLuTAKqWW03F9', // Domi - bold female
      'kdmDKE6EkgrWrrykO9Qt', // Emily - sophisticated female
      'XrExE9yKIg1WjnnlVkGX', // Matilda - sweet female
      'CYw3kZ02Hs0563khs1Fj', // Nova - modern female
      'XB0fDUnXU5powFXDhCwa', // Charlotte - calm female
      'VR6AewLTigWG4xSOukaG', // Lily - sweet female
      'pqHfZKP75CvOlQylNhV4', // Bella - seductive female
      'g6xIsTj2HwM6VR4iXFCw', // Jessica Anne Bogart - empathetic
      'OYTbf65OHHFELVut7v2H', // Hope - bright and uplifting
      'dj3G1R1ilKoFKhBnWOzG', // Eryn - friendly and relatable
      'PT4nqlKZfc06VW1BuClj', // Angela - raw and relatable
      '56AoDkrOh6qfVPDXZ7Pt'  // Cassidy - engaging and energetic
    ];

    // Validate and ensure female voice only
    let validatedVoiceId = voice_id;
    if (!FEMALE_VOICES.includes(voice_id)) {
      console.log('⚠️ Invalid or male voice detected, using female fallback');
      validatedVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Default to Luna (female)
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
    console.log('🎤 Using FEMALE voice ID:', validatedVoiceId);

    // ElevenLabs API configuration
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
    const audioData = await makeElevenLabsRequest(processedText, validatedVoiceId, modelId, finalVoiceSettings, apiKey);
    
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
    .replace(/[.]{2,}/g, '.') // Replace multiple periods with single
    .replace(/[!]{2,}/g, '!') // Replace multiple exclamations with single
    .replace(/[?]{2,}/g, '?') // Replace multiple questions with single
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Add natural pauses for better speech flow
  processed = processed
    .replace(/\.\s+/g, '. ') // Ensure space after periods
    .replace(/,\s+/g, ', ') // Ensure space after commas
    .replace(/!\s+/g, '! ') // Ensure space after exclamations
    .replace(/\?\s+/g, '? '); // Ensure space after questions

  return processed;
}

// Make request to ElevenLabs API
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
        'Content-Length': Buffer.byteLength(postData),
        'xi-api-key': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const audioBuffer = Buffer.concat(data);
          resolve(audioBuffer);
        } else {
          const errorText = Buffer.concat(data).toString();
          console.error('❌ ElevenLabs API Error:', res.statusCode, errorText);
          reject(new Error(`ElevenLabs API error: ${res.statusCode} - ${errorText}`));
        }
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
