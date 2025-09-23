// AI Image Generation API Endpoint
// Supports multiple providers: OpenAI DALL-E, Stable Diffusion

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, prompt, style, quality, size } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`🎨 Generating image with ${provider}:`, { prompt, style, quality });

    let result;

    if (provider === 'dalle') {
      result = await generateWithDALLE(prompt, { style, quality, size });
    } else if (provider === 'stable-diffusion') {
      result = await generateWithStableDiffusion(prompt, { style, quality });
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (!result) {
      return res.status(500).json({ error: 'Image generation failed' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Image generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
}

// OpenAI DALL-E 3 Integration
async function generateWithDALLE(prompt, options = {}) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ OpenAI API key not found, skipping DALL-E');
      return null;
    }

    console.log('🎨 Calling OpenAI DALL-E API...');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style === 'anime' ? 'vivid' : 'natural'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ DALL-E API error:', errorData);
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      console.log('✅ DALL-E generation successful');
      return {
        url: data.data[0].url,
        revised_prompt: data.data[0].revised_prompt || prompt
      };
    }

    return null;
  } catch (error) {
    console.error('❌ DALL-E generation failed:', error);
    return null;
  }
}

// Stable Diffusion Integration (using Hugging Face or similar)
async function generateWithStableDiffusion(prompt, options = {}) {
  try {
    // For demo purposes, we'll use a mock response
    // In production, you would integrate with Hugging Face, Stability AI, or similar
    
    console.log('🎨 Using Stable Diffusion fallback...');
    
    // Mock implementation - in production, integrate with actual Stable Diffusion API
    // Example with Hugging Face:
    /*
    const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        options: {
          wait_for_model: true
        }
      }),
    });
    */

    // For now, return a placeholder
    console.log('⚠️ Stable Diffusion not implemented, using placeholder');
    return null;

  } catch (error) {
    console.error('❌ Stable Diffusion generation failed:', error);
    return null;
  }
}

// Input validation and safety
function validatePrompt(prompt) {
  if (!prompt || prompt.trim().length < 3) {
    return { valid: false, error: 'Prompt too short' };
  }
  
  if (prompt.length > 1000) {
    return { valid: false, error: 'Prompt too long' };
  }
  
  // Basic content filtering
  const inappropriateTerms = [
    'nude', 'naked', 'nsfw', 'explicit', 'sexual', 'erotic'
  ];
  
  const hasInappropriate = inappropriateTerms.some(term => 
    prompt.toLowerCase().includes(term)
  );
  
  if (hasInappropriate) {
    return { valid: false, error: 'Inappropriate content detected' };
  }
  
  return { valid: true };
} 