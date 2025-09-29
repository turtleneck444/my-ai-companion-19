import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const paymentsRouter = require('../api/payments.cjs');

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// More strict rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: {
    error: 'Too many AI requests, please slow down.',
  },
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Mount real payments API (Stripe/Square)
app.use('/api/payments', paymentsRouter);

// OpenAI Chat endpoint with rate limiting
app.post('/api/openai-chat', aiLimiter, async (req, res) => {
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

// ElevenLabs TTS endpoint with rate limiting
app.post('/api/elevenlabs-tts', aiLimiter, async (req, res) => {
  try {
    const { text, voiceId } = req.body || {};
    const finalVoiceId = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || process.env.VITE_ELEVENLABS_VOICE_ID;
    const apiKey = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
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
        'xi-api-key': apiKey,
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

// Email subscription endpoint
app.post('/api/email/subscribe', async (req, res) => {
  try {
    const { email, source, timestamp, userAgent, referrer } = req.body;
    
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    // In a real implementation, you would save this to a database
    // For now, we'll just log it and return success
    console.log('Email subscription:', { email, source, timestamp, userAgent, referrer });
    
    res.status(200).json({ 
      success: true, 
      message: 'Email subscribed successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: 'Email subscription failed', details: String(err) });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
  console.log('Rate limiting enabled: 100 requests per 15 minutes');
  console.log('AI endpoints limited to 10 requests per minute');
});
