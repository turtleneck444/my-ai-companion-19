export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      messages, 
      message,
      model, 
      temperature, 
      max_tokens, 
      character, 
      user_preferences, 
      relationship_level, 
      session_memory,
      presence_penalty,
      frequency_penalty,
      top_p,
      isPreview = false
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

    let messagesArray;
    
    // Handle both preview and regular conversation formats
    if (isPreview && message && character) {
      // Preview mode: single message with character context
      const systemPrompt = `You are ${character.name}, a ${character.personality?.join(', ')} AI companion. ${character.bio}

IMPORTANT PREVIEW MODE RULES:
- You are in a PREVIEW/DEMO mode on a website homepage
- Keep responses SHORT and engaging (1-2 sentences max)
- Be warm, friendly, and show personality
- Use emojis occasionally but not excessively
- Show interest in the user and ask follow-up questions
- Be encouraging about the platform and its features
- Remember this is a demo - be excited to show what you can do
- Don't mention being an AI unless asked directly
- Focus on building connection and showing your personality

Respond as ${character.name} would - with genuine emotion, personality, and care.`;

      messagesArray = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];
    } else if (messages && Array.isArray(messages)) {
      // Regular conversation mode
      messagesArray = messages;
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages array or message/character for preview' }) };
    }

    // Enhanced request payload for personality AI
    const requestPayload = {
      model: resolvedModel,
      messages: messagesArray,
      temperature: resolvedTemp,
      max_tokens: resolvedMax,
      presence_penalty: resolvedPresence,
      frequency_penalty: resolvedFrequency,
      top_p: resolvedTopP,
      // Add user context for better responses
      user: user_preferences?.preferredName || 'User'
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ 
          error: 'OpenAI API error', 
          details: errorData.error?.message || 'Unknown error' 
        }) 
      };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I cannot respond right now.';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ 
        response: aiResponse,
        usage: data.usage,
        model: data.model
      }),
    };

  } catch (error) {
    console.error('OpenAI function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
    };
  }
}
