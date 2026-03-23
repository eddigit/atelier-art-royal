const { requireAuth } = require('../lib/auth');

const SUMUP_API_KEY = process.env.SUMUP_API_KEY;
const SUMUP_MERCHANT_CODE = 'MDELMUGR';

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
    const user = requireAuth(req, res);
    if (!user) return;

    const { amount, reference, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!SUMUP_API_KEY) {
      console.error('SUMUP_API_KEY not configured');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const payload = {
      checkout_reference: reference,
      amount: parseFloat(amount),
      currency: 'EUR',
      merchant_code: SUMUP_MERCHANT_CODE,
      description: description || 'Atelier Art Royal - Commande',
      redirect_url: `https://artroyal.fr/OrderConfirmation?order=${reference}`,
      hosted_checkout: {
        enabled: true,
      },
    };

    console.log('Creating SumUp checkout with payload:', JSON.stringify(payload, null, 2));

    // Create SumUp checkout
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('SumUp Response Status:', response.status);
    console.log('SumUp Response Body:', responseText);

    if (!response.ok) {
      let errorMsg = 'SumUp API error';
      let errorDetails = responseText;
      try {
        const error = JSON.parse(responseText);
        errorMsg = error.error_message || error.message || errorMsg;
        errorDetails = JSON.stringify(error, null, 2);
      } catch {
        // responseText is not JSON
      }
      console.error('SumUp Error:', errorDetails);
      return res.status(400).json({
        success: false,
        error: errorMsg,
        details: errorDetails,
      });
    }

    const checkout = JSON.parse(responseText);
    console.log('SumUp Checkout Created:', JSON.stringify(checkout, null, 2));

    if (!checkout.id || !checkout.hosted_checkout_url) {
      console.error('Missing checkout ID or hosted URL');
      return res.status(500).json({
        success: false,
        error: 'Réponse SumUp invalide',
        fullResponse: checkout,
      });
    }

    console.log('Checkout URL:', checkout.hosted_checkout_url);

    return res.status(200).json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: checkout.hosted_checkout_url,
      amount: checkout.amount,
      currency: checkout.currency,
    });
  } catch (error) {
    console.error('createSumupCheckout error:', error);
    return res.status(500).json({ error: error.message });
  }
};
