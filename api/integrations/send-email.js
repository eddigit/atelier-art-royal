// TODO: Implement email sending via Resend (https://resend.com) or SendGrid.
// Requires RESEND_API_KEY or SENDGRID_API_KEY environment variable.
// Should accept { to, subject, html, from? } in request body.

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
    console.log('send-email called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Email integration not configured yet' });
  } catch (error) {
    console.error('send-email error:', error);
    return res.status(500).json({ error: error.message });
  }
};
