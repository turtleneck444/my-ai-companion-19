// Enhanced ElevenLabs TTS API with FEMALE VOICES ONLY
// This endpoint handles text-to-speech conversion using ElevenLabs API

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Confirmed female voices from ElevenLabs documentation
const FEMALE_VOICES = [
  'kdmDKE6EkgrWrrykO9Qt', // Alexandra - super realistic, young female voice
  'g6xIsTj2HwM6VR4iXFCw', // Jessica Anne Bogart - empathetic and expressive
  'OYTbf65OHHFELVut7v2H', // Hope - bright and uplifting
  'dj3G1R1ilKoFKhBnWOzG', // Eryn - friendly and relatable
  'PT4nqlKZfc06VW1BuClj', // Angela - raw and relatable
  '56AoDkrOh6qfVPDXZ7Pt'  // Cassidy - engaging and energetic
];

// Default voice settings for more natural speech
const defaultVoiceSettings = {
  stability: 0.3,
  similarity_boost: 0.9,
  style: 0.6,
  use_speaker_boost: true
};

// Validate voice ID is female
function isValidFemaleVoice(voiceId) {
  return FEMALE_VOICES.includes(voiceId);
}

// Get default female voice
function getDefaultFemaleVoice() {
  return 'kdmDKE6EkgrWrrykO9Qt'; // Alexandra - confirmed female
}

// Enhanced voice settings for more natural speech
function getVoiceSettings(voiceId) {
  return {
    stability: 0.3,
    similarity_boost: 0.9,
    style: 0.6,
    use_speaker_boost: true
  };
}

// Main handler function
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎤 ElevenLabs TTS API called');
    
    const { 
      text, 
      voice_id, 
      model_id, 
      voice_settings,
      user_id 
    } = req.body;

    // Validate required fields
    if (!text) {
      console.error('❌ Missing text parameter');
      return res.status(400).json({ error: 'Text is required' });
    }

    // Validate text length
    if (text.length > 5000) {
      console.error('❌ Text too long:', text.length);
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    // Get voice ID - ensure it's a female voice
    let finalVoiceId = voice_id;
    
    // If no voice provided or invalid voice, use default female voice
    if (!finalVoiceId || !isValidFemaleVoice(finalVoiceId)) {
      console.log('⚠️ Invalid or missing voice ID, using default female voice');
      finalVoiceId = getDefaultFemaleVoice();
    }

    // Validate voice is female
    if (!isValidFemaleVoice(finalVoiceId)) {
      console.log('🚫 Blocked male voice, using female default');
      finalVoiceId = getDefaultFemaleVoice();
    }

    console.log('🎤 Using voice:', finalVoiceId, '(validated female)');

    // Get model ID
    const modelId = model_id || 'eleven_multilingual_v2';
    
    // Get API key from environment variables
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error('❌ ElevenLabs API key not found');
      return res.status(500).json({ error: 'TTS service not configured' });
    }

    // Get voice settings
    const finalVoiceSettings = voice_settings || getVoiceSettings(finalVoiceId);

    console.log('🎤 Voice settings:', finalVoiceSettings);

    // Make request to ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: finalVoiceSettings
      })
    });

    console.log('📡 ElevenLabs response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'TTS generation failed',
        details: errorText
      });
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('✅ TTS generation successful');

    // Return audio data
    return res.status(200).json({
      success: true,
      audio: audioBase64,
      voice_id: finalVoiceId,
      model_id: modelId,
      voice_settings: finalVoiceSettings,
      message: 'Audio generated successfully'
    });

  } catch (error) {
    console.error('💥 ElevenLabs TTS error:', error);
    return res.status(500).json({ 
      error: 'TTS generation failed',
      details: error.message
    });
  }
}
