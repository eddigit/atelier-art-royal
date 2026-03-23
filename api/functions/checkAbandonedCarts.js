// TODO: Implement abandoned cart detection.
// Should query cart_items older than X hours with no associated order,
// and trigger reminder emails via the email integration.

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
    console.log('checkAbandonedCarts called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Abandoned cart check not configured yet' });
  } catch (error) {
    console.error('checkAbandonedCarts error:', error);
    return res.status(500).json({ error: error.message });
  }
};
