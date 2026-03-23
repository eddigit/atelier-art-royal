// TODO: Integrate with Resend (https://resend.com) or SendGrid for transactional emails.
// This route should send an order confirmation email to the customer with order details,
// and optionally notify the admin of the new order.

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
    console.log('sendOrderConfirmation called with:', JSON.stringify(req.body));
    return res.status(200).json({ success: true, message: 'Email sending not configured yet' });
  } catch (error) {
    console.error('sendOrderConfirmation error:', error);
    return res.status(500).json({ error: error.message });
  }
};
