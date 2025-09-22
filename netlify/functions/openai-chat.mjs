export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { messages, model, temperature, max_tokens } = body;
    const resolvedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const resolvedTemp = typeof temperature === 'number' ? temperature : 0.8;
    const resolvedMax = typeof max_tokens === 'number' ? max_tokens : 220;

    if (!process.env.OPENAI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENAI_API_KEY' }) };
    }
    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages array' }) };
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
      return { statusCode: response.status, body: error };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify({ message: data.choices?.[0]?.message?.content ?? '' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI proxy error', details: String(err) }) };
  }
}
