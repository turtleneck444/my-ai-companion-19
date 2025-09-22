export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { text, voiceId } = body;
    const finalVoiceId = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || process.env.VITE_ELEVENLABS_VOICE_ID;
    if (!process.env.ELEVENLABS_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing ELEVENLABS_API_KEY' }) };
    }
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing text' }) };
    }
    const vid = finalVoiceId || '21m00Tcm4TlvDq8ikWAM';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { statusCode: response.status, body: error };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ElevenLabs proxy error', details: String(err) }) };
  }
}
