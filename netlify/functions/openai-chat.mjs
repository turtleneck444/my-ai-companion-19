export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
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
    } = body;
    
    // Enhanced model selection for personality AI
    const resolvedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    // Optimized settings for personality-driven responses
    const resolvedTemp = typeof temperature === 'number' ? temperature : 0.9; // Higher for creativity
    const resolvedMax = typeof max_tokens === 'number' ? max_tokens : 250; // Increased for detailed responses
    const resolvedPresence = typeof presence_penalty === 'number' ? presence_penalty : 0.6; // Encourage new topics
    const resolvedFrequency = typeof frequency_penalty === 'number' ? frequency_penalty : 0.3; // Reduce repetition
    const resolvedTopP = typeof top_p === 'number' ? top_p : 0.95; // High quality responses

    if (!process.env.OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENAI_API_KEY' }) };
    }
    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages array' }) };
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

    // Add character context logging for debugging
    if (character) {
      console.log(`🎭 Generating response for character: ${character}`);
    }
    
    if (relationship_level) {
      console.log(`💕 Relationship level: ${relationship_level}`);
    }

    if (session_memory && Object.keys(session_memory).length > 0) {
      console.log(`🧠 Using session memory with ${session_memory.topics?.length || 0} topics`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${error}`);
      return { statusCode: response.status, body: error };
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content ?? '';
    
    // Log successful personality response
    if (character && responseContent) {
      console.log(`✨ Generated personality response for ${character}: ${responseContent.slice(0, 50)}...`);
    }

    return { statusCode: 200, body: JSON.stringify({ message: responseContent }) };
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI proxy error', details: String(err) }) };
  }
}
