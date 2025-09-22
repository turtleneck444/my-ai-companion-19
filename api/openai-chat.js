export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
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
}
