// api/claude.js - Vercel API Route to proxy Claude API requests
// This bypasses CORS issues by routing requests through your server

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model, max_tokens, temperature, apiKey } = req.body;

    // Validate inputs
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Call Claude API from the server (no CORS issues!)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-4-20250514',
        max_tokens: parseInt(max_tokens) || 2000,
        temperature: parseFloat(temperature) || 0.7,
        messages: messages
      })
    });

    // Get the response
    const data = await response.json();

    // If API returned an error, pass it through
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Success! Return the response
    return res.status(200).json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return res.status(500).json({
      error: 'Failed to call Claude API',
      details: error.message
    });
  }
}
