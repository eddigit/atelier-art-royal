// TODO: Implement AI chat using Groq API (https://console.groq.com).
// Requires GROQ_API_KEY environment variable.
// Should use a model like llama3 or mixtral for product recommendations and customer support.

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
    console.log('aiChat called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'AI chat not configured yet. Requires GROQ_API_KEY.' });
  } catch (error) {
    console.error('aiChat error:', error);
    return res.status(500).json({ error: error.message });
  }
};
