// api/chat.js - Vercel serverless function
export default async function handler(req, res) {
  // --- CORS ---
  const allowOrigin = process.env.ALLOW_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid body: { messages: [...] } required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    // Call OpenAI
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    });

    const text = await r.text();
    if (!r.ok) {
      let detail = text;
      try { detail = JSON.parse(text); } catch {}
      return res.status(r.status).json({ error: 'OpenAI error', detail });
    }

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ content: reply });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
