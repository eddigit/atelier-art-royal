// TODO: Implement customer reactivation emails.
// Should find users who haven't ordered in X days and send them a reactivation/promotion email.

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
    console.log('sendReactivationEmails called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Reactivation emails not configured yet' });
  } catch (error) {
    console.error('sendReactivationEmails error:', error);
    return res.status(500).json({ error: error.message });
  }
};
