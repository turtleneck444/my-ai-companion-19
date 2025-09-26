export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  console.log('🔧 OpenAI API Debug:');
  console.log('- OPENAI_API_KEY available:', !!process.env.OPENAI_API_KEY);
  console.log('- VITE_OPENAI_API_KEY available:', !!process.env.VITE_OPENAI_API_KEY);
  
  try {
    const { 
      messages, 
      model, 
      temperature, 
      max_tokens, 
      character, 
      user_preferences, 
      relationship_level, 
      session_memory,
      presence_penalty,
      frequency_penalty,
      top_p
    } = req.body || {};
    
    // Enhanced model selection for personality AI
    const resolvedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    // Optimized settings for personality-driven responses
    const resolvedTemp = typeof temperature === 'number' ? temperature : 0.9; // Higher for creativity
    const resolvedMax = typeof max_tokens === 'number' ? max_tokens : 250; // Increased for detailed responses
    const resolvedPresence = typeof presence_penalty === 'number' ? presence_penalty : 0.6; // Encourage new topics
    const resolvedFrequency = typeof frequency_penalty === 'number' ? frequency_penalty : 0.3; // Reduce repetition
    const resolvedTopP = typeof top_p === 'number' ? top_p : 0.95; // High quality responses

    if (!process.env.OPENAI_API_KEY && !process.env.VITE_OPENAI_API_KEY) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY or VITE_OPENAI_API_KEY' });
      return;
    }
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing messages array' });
      return;
    }

    // Enhanced request payload for personality AI
    const requestPayload = {
      model: resolvedModel,
      messages,
      temperature: resolvedTemp,
      max_tokens: resolvedMax,
      presence_penalty: resolvedPresence,
      frequency_penalty: resolvedFrequency,
      top_p: resolvedTopP,
      // Add user context for better responses
      user: user_preferences?.preferredName || 'User'
    };

    // Add character context in system message if available
    if (character) {
      console.log(`🎭 Generating response for character: ${character}`);
    }
    
    if (relationship_level) {
      console.log(`💕 Relationship level: ${relationship_level}`);
    }

    if (session_memory && Object.keys(session_memory).length > 0) {
      console.log(`🧠 Using session memory with ${session_memory.topics?.length || 0} topics`);
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ OpenAI API key not found');
      res.status(500).json({ error: 'OpenAI API key not configured' });
      return;
    }

    console.log('🔑 Using API key:', apiKey.substring(0, 20) + '...');
    console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('📥 OpenAI Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} - ${error}`);
      res.status(response.status).json({ error: `OpenAI API error: ${response.status}`, details: error });
      return;
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content ?? '';
    
    // Log successful personality response
    if (character && responseContent) {
      console.log(`✨ Generated personality response for`, character, ':', responseContent.slice(0, 50) + '...');
    }

    console.log('✅ Sending OpenAI response:', {
      messageLength: responseContent.length,
      firstWords: responseContent.slice(0, 30) + '...'
    });

    res.status(200).json({ message: responseContent });
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    res.status(500).json({ error: 'OpenAI proxy error', details: String(err) });
  }
}
