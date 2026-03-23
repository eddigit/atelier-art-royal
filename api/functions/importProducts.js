// TODO: Implement bulk product import from CSV/JSON.
// Should validate data, handle upserts, and report errors per row.

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
    console.log('importProducts called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Product import not configured yet' });
  } catch (error) {
    console.error('importProducts error:', error);
    return res.status(500).json({ error: error.message });
  }
};
