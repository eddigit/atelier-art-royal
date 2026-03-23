// TODO: Implement LLM invocation via Groq, OpenAI, or similar provider.
// Requires the appropriate API key as an environment variable.
// Should accept { prompt, model?, max_tokens? } in request body.

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('invoke-llm called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'LLM integration not configured yet' });
  } catch (error) {
    console.error('invoke-llm error:', error);
    return res.status(500).json({ error: error.message });
  }
};
