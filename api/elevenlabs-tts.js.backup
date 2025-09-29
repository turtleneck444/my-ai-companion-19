export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { text, voiceId } = req.body || {};
    const finalVoiceId = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID;
    if (!process.env.ELEVENLABS_API_KEY) {
      res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY' });
      return;
    }
    if (!text) {
      res.status(400).json({ error: 'Missing text' });
      return;
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
      res.status(response.status).send(error);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'ElevenLabs proxy error', details: String(err) });
  }
}
