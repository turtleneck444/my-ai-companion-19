import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/openai-chat', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body || {};
    const resolvedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const resolvedTemp = typeof temperature === 'number' ? temperature : 0.8;
    const resolvedMax = typeof max_tokens === 'number' ? max_tokens : 220;

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
      return;
    }
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing messages array' });
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature: resolvedTemp,
        max_tokens: resolvedMax,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(response.status).send(error);
      return;
    }

    const data = await response.json();
    res.status(200).json({ message: data.choices?.[0]?.message?.content ?? '' });
  } catch (err) {
    res.status(500).json({ error: 'OpenAI proxy error', details: String(err) });
  }
});

app.post('/api/elevenlabs-tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body || {};
    const finalVoiceId = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || process.env.VITE_ELEVENLABS_VOICE_ID;
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
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
}); 