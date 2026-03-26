import { requireAuth } from '../lib/auth.js';

const SUMUP_API_KEY = process.env.SUMUP_API_KEY;
const SUMUP_MERCHANT_CODE = 'MDELMUGR';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

// === createSumupCheckout ===
async function createSumupCheckout(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { amount, reference, description } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!SUMUP_API_KEY) return res.status(500).json({ error: 'Payment gateway not configured' });

  const payload = {
    checkout_reference: reference,
    amount: parseFloat(amount),
    currency: 'EUR',
    merchant_code: SUMUP_MERCHANT_CODE,
    description: description || 'Atelier Art Royal - Commande',
    redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artroyal.fr'}/OrderConfirmation?order=${reference}`,
    hosted_checkout: { enabled: true },
  };

  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUMUP_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    let errorMsg = 'SumUp API error';
    try { errorMsg = JSON.parse(responseText).error_message || errorMsg; } catch {}
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const checkout = JSON.parse(responseText);
  if (!checkout.id || !checkout.hosted_checkout_url) {
    return res.status(500).json({ success: false, error: 'Invalid SumUp response' });
  }

  return res.status(200).json({
    success: true, checkoutId: checkout.id, checkoutUrl: checkout.hosted_checkout_url,
    amount: checkout.amount, currency: checkout.currency,
  });
}

// === verifySumupPayment ===
async function verifySumupPayment(req, res) {
  const { checkoutId } = req.body;
  if (!checkoutId) return res.status(400).json({ error: 'Checkout ID required' });
  if (!SUMUP_API_KEY) return res.status(500).json({ error: 'Payment gateway not configured' });

  const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${SUMUP_API_KEY}` },
  });
  if (!response.ok) return res.status(400).json({ error: 'Failed to verify payment' });

  const checkout = await response.json();
  return res.status(200).json({
    success: true, status: checkout.status, transactionId: checkout.transaction_id,
    amount: checkout.amount, currency: checkout.currency, paid: checkout.status === 'PAID',
  });
}

// === Stub functions (to be implemented later) ===
function stub(name) {
  return async (_req, res) => {
    console.log(`[STUB] ${name} called`);
    return res.status(200).json({ success: true, message: `${name}: not implemented yet` });
  };
}

const HANDLERS = {
  createSumupCheckout,
  verifySumupPayment,
  sendOrderConfirmation: stub('sendOrderConfirmation'),
  notifyOrderStatus: stub('notifyOrderStatus'),
  notifyLeadCreated: stub('notifyLeadCreated'),
  generateInvoice: stub('generateInvoice'),
  generateQuotePdf: stub('generateQuotePdf'),
  aiChat: stub('aiChat'),
  importProducts: stub('importProducts'),
  importProductsWithProgress: stub('importProductsWithProgress'),
  checkAbandonedCarts: stub('checkAbandonedCarts'),
  sendReactivationEmails: stub('sendReactivationEmails'),
  requestReview: stub('requestReview'),
  createBackendCustomer: stub('createBackendCustomer'),
  getSecrets: stub('getSecrets'),
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const name = req.query.name;
    const fn = HANDLERS[name];
    if (!fn) return res.status(404).json({ error: `Unknown function: ${name}` });
    return await fn(req, res);
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: error.message });
  }
}
