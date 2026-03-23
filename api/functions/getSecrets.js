// Secrets are now stored as environment variables on the VPS / Vercel.
// This endpoint exists for backward compatibility with frontend code that may call it.
// It returns an empty object — all secrets should be accessed server-side via process.env.

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
    return res.status(200).json({});
  } catch (error) {
    console.error('getSecrets error:', error);
    return res.status(500).json({ error: error.message });
  }
};
