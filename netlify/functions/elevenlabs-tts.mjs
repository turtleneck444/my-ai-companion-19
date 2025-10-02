export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { text, voiceId, voice_id, model_id, voice_settings } = body;
    const finalVoiceId = voice_id || voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID;
    // Use the correct API key with 29,000 credits as primary fallback
    const apiKey = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || '03c1fb7bb39fa7c890c0471cf1a79b93b96c3267b8ce41aa9e41162c7185a876';
    console.log('🔑 API Key check:\, {
      vite: !!process.env.VITE_ELEVENLABS_API_KEY,
      regular: !!process.env.ELEVENLABS_API_KEY,
      using: apiKey ? 'Found' : 'Missing'
    });
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing ELEVENLABS_API_KEY' }) };
    }
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing text' }) };
    }
    const vid = finalVoiceId || 'kdmDKE6EkgrWrrykO9Qt'; // Alexandra - female voice

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id || 'eleven_multilingual_v2',
        voice_settings: voice_settings || {
          stability: 0.15,
          similarity_boost: 0.98,
          style: 0.85,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'ElevenLabs API error', 
          details: errorText,
          status: response.status 
        })
      };
    }

    const audioBuffer = await response.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      },
      body: Buffer.from(audioBuffer).toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
}
