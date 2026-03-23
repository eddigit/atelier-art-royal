const SUMUP_API_KEY = process.env.SUMUP_API_KEY;

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
    const { checkoutId } = req.body;

    if (!checkoutId) {
      return res.status(400).json({ error: 'Checkout ID required' });
    }

    if (!SUMUP_API_KEY) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    // Get checkout status from SumUp
    const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SUMUP_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to verify payment' });
    }

    const checkout = await response.json();

    return res.status(200).json({
      success: true,
      status: checkout.status,
      transactionId: checkout.transaction_id,
      amount: checkout.amount,
      currency: checkout.currency,
      paid: checkout.status === 'PAID',
    });
  } catch (error) {
    console.error('verifySumupPayment error:', error);
    return res.status(500).json({ error: error.message });
  }
};
