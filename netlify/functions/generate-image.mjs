// AI Image Generation Netlify Function
// Supports OpenAI DALL-E 3 with fallbacks

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { provider, prompt, style, quality, size } = JSON.parse(event.body || '{}');

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }

    console.log(`🎨 Generating image with ${provider}:`, { prompt, style, quality });

    let result;

    if (provider === 'dalle') {
      result = await generateWithDALLE(prompt, { style, quality, size });
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid provider' })
      };
    }

    if (!result) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Image generation failed' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Image generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate image',
        details: error.message 
      })
    };
  }
};

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