export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY' });
      return;
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(response.status).json({ error: 'Failed to fetch voices', details: error });
      return;
    }

    const data = await response.json();
    
    // Transform the voices data to include personality suggestions
    const voicesWithPersonality = data.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      labels: voice.labels,
      preview_url: voice.preview_url,
      // Suggest personality traits based on voice characteristics
      suggestedPersonality: getSuggestedPersonality(voice),
      // Voice characteristics for sliders
      characteristics: {
        warmth: getVoiceWarmth(voice),
        energy: getVoiceEnergy(voice),
        clarity: getVoiceClarity(voice),
        depth: getVoiceDepth(voice)
      }
    }));

    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).json({ voices: voicesWithPersonality });
  } catch (err) {
    res.status(500).json({ error: 'ElevenLabs voices error', details: String(err) });
  }
}

function getSuggestedPersonality(voice) {
  const suggestions = [];
  const name = voice.name.toLowerCase();
  const description = (voice.description || '').toLowerCase();
  const labels = Object.values(voice.labels || {}).join(' ').toLowerCase();
  
  const text = `${name} ${description} ${labels}`;
  
  if (text.includes('warm') || text.includes('gentle') || text.includes('soft')) {
    suggestions.push('Caring', 'Gentle', 'Sweet');
  }
  if (text.includes('energetic') || text.includes('bright') || text.includes('cheerful')) {
    suggestions.push('Energetic', 'Playful', 'Funny');
  }
  if (text.includes('deep') || text.includes('rich') || text.includes('mature')) {
    suggestions.push('Confident', 'Mysterious', 'Bold');
  }
  if (text.includes('romantic') || text.includes('sultry') || text.includes('seductive')) {
    suggestions.push('Romantic', 'Loving', 'Affectionate');
  }
  if (text.includes('clear') || text.includes('crisp') || text.includes('articulate')) {
    suggestions.push('Intelligent', 'Witty', 'Confident');
  }
  
  // Default suggestions if no matches
  if (suggestions.length === 0) {
    suggestions.push('Caring', 'Playful', 'Confident');
  }
  
  return [...new Set(suggestions)].slice(0, 3);
}

function getVoiceWarmth(voice) {
  const text = `${voice.name} ${voice.description || ''} ${Object.values(voice.labels || {}).join(' ')}`.toLowerCase();
  if (text.includes('warm') || text.includes('gentle') || text.includes('soft')) return 80;
  if (text.includes('cold') || text.includes('harsh') || text.includes('sharp')) return 20;
  return 50;
}

function getVoiceEnergy(voice) {
  const text = `${voice.name} ${voice.description || ''} ${Object.values(voice.labels || {}).join(' ')}`.toLowerCase();
  if (text.includes('energetic') || text.includes('bright') || text.includes('cheerful')) return 85;
  if (text.includes('calm') || text.includes('soft') || text.includes('gentle')) return 30;
  return 60;
}

function getVoiceClarity(voice) {
  const text = `${voice.name} ${voice.description || ''} ${Object.values(voice.labels || {}).join(' ')}`.toLowerCase();
  if (text.includes('clear') || text.includes('crisp') || text.includes('articulate')) return 90;
  if (text.includes('muffled') || text.includes('soft') || text.includes('whisper')) return 40;
  return 70;
}

function getVoiceDepth(voice) {
  const text = `${voice.name} ${voice.description || ''} ${Object.values(voice.labels || {}).join(' ')}`.toLowerCase();
  if (text.includes('deep') || text.includes('rich') || text.includes('mature')) return 85;
  if (text.includes('high') || text.includes('light') || text.includes('young')) return 25;
  return 55;
}
