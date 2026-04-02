import { requireAuth } from '../lib/auth.js';
import { sendEmail } from '../lib/ses.js';
import { query } from '../lib/db.js';

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

// === sendOrderConfirmation ===
async function sendOrderConfirmation(req, res) {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    // Get customer email
    let customerEmail = null;
    if (order.customer_id) {
      const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [order.customer_id]);
      if (userResult.rows.length > 0) customerEmail = userResult.rows[0].email;
    }

    const items = order.items || [];
    const itemsHtml = items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product_name || 'Produit'}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity || 1}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(i.total || i.price || 0).toFixed(2)}€</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#1a1a2e;padding:30px;text-align:center">
          <h1 style="color:#c9a84c;margin:0;font-size:24px">Atelier Art Royal</h1>
          <p style="color:#fff;margin:5px 0 0;font-size:14px">Haute Couture Maçonnique</p>
        </div>
        <div style="padding:30px">
          <h2 style="color:#1a1a2e">Confirmation de commande</h2>
          <p>Merci pour votre commande <strong>${order.order_number}</strong> !</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead><tr style="background:#f5f5f5">
              <th style="padding:10px;text-align:left">Produit</th>
              <th style="padding:10px;text-align:center">Qté</th>
              <th style="padding:10px;text-align:right">Total</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr>
              <td colspan="2" style="padding:12px;font-weight:bold;text-align:right">Total</td>
              <td style="padding:12px;font-weight:bold;text-align:right;font-size:18px">${(order.total || 0).toFixed(2)}€</td>
            </tr></tfoot>
          </table>
          <p style="color:#666;font-size:14px">Vous recevrez un email de suivi dès l'expédition de votre commande.</p>
          <p style="color:#666;font-size:14px">Pour toute question : <a href="mailto:contact@artroyal.fr">contact@artroyal.fr</a></p>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#999">
          Atelier Art Royal — Haute Couture Maçonnique<br>
          <a href="https://artroyal.fr" style="color:#c9a84c">artroyal.fr</a>
        </div>
      </div>`;

    const results = [];

    // Send to customer
    if (customerEmail) {
      const r = await sendEmail({
        to: customerEmail,
        subject: `Confirmation de commande ${order.order_number} — Atelier Art Royal`,
        bodyHtml: html,
        bodyText: `Merci pour votre commande ${order.order_number} ! Total : ${(order.total || 0).toFixed(2)}€. Pour toute question : contact@artroyal.fr`,
      });
      results.push({ to: customerEmail, ...r });
    }

    // Notify shop owner
    const ownerHtml = `<p>Nouvelle commande <strong>${order.order_number}</strong> reçue !</p><p>Total : ${(order.total || 0).toFixed(2)}€</p><p>Client : ${customerEmail || 'inconnu'}</p><p><a href="https://artroyal.fr/AdminOrders">Voir dans l'admin</a></p>`;
    const rOwner = await sendEmail({
      to: 'contact@artroyal.fr',
      subject: `🛒 Nouvelle commande ${order.order_number} — ${(order.total || 0).toFixed(2)}€`,
      bodyHtml: ownerHtml,
      bodyText: `Nouvelle commande ${order.order_number} — ${(order.total || 0).toFixed(2)}€ — Client: ${customerEmail || 'inconnu'}`,
    });
    results.push({ to: 'contact@artroyal.fr', ...rOwner });

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('sendOrderConfirmation error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// === notifyOrderStatus ===
async function notifyOrderStatus(req, res) {
  const { orderId, status } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  try {
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderResult.rows[0];

    let customerEmail = null;
    if (order.customer_id) {
      const userResult = await query('SELECT email FROM users WHERE id = $1', [order.customer_id]);
      if (userResult.rows.length > 0) customerEmail = userResult.rows[0].email;
    }

    if (!customerEmail) return res.status(200).json({ success: true, message: 'No customer email' });

    const statusLabels = {
      processing: 'en cours de préparation',
      shipped: 'expédiée',
      delivered: 'livrée',
      cancelled: 'annulée',
    };
    const label = statusLabels[status || order.status] || (status || order.status);
    const tracking = order.tracking_number ? `<p>Numéro de suivi : <strong>${order.tracking_number}</strong></p>` : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a1a2e;padding:20px;text-align:center">
          <h1 style="color:#c9a84c;margin:0">Atelier Art Royal</h1>
        </div>
        <div style="padding:30px">
          <h2>Mise à jour de votre commande</h2>
          <p>Votre commande <strong>${order.order_number}</strong> est maintenant <strong>${label}</strong>.</p>
          ${tracking}
          <p style="color:#666">Pour toute question : <a href="mailto:contact@artroyal.fr">contact@artroyal.fr</a></p>
        </div>
      </div>`;

    const r = await sendEmail({
      to: customerEmail,
      subject: `Commande ${order.order_number} — ${label} — Atelier Art Royal`,
      bodyHtml: html,
    });

    return res.status(200).json({ success: true, ...r });
  } catch (err) {
    console.error('notifyOrderStatus error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// === notifyLeadCreated ===
async function notifyLeadCreated(req, res) {
  const { name, email, phone, message } = req.body;
  const html = `<h3>Nouveau contact depuis artroyal.fr</h3><p><strong>Nom :</strong> ${name || 'N/A'}</p><p><strong>Email :</strong> ${email || 'N/A'}</p><p><strong>Tél :</strong> ${phone || 'N/A'}</p><p><strong>Message :</strong></p><p>${(message || '').replace(/\n/g, '<br>')}</p>`;

  const r = await sendEmail({
    to: 'contact@artroyal.fr',
    subject: `📩 Nouveau message de ${name || email || 'un visiteur'} — artroyal.fr`,
    bodyHtml: html,
    replyTo: email || undefined,
  });

  return res.status(200).json({ success: true, ...r });
}

// === Stub functions (remaining) ===
function stub(name) {
  return async (_req, res) => {
    console.log(`[STUB] ${name} called`);
    return res.status(200).json({ success: true, message: `${name}: not implemented yet` });
  };
}

const HANDLERS = {
  createSumupCheckout,
  verifySumupPayment,
  sendOrderConfirmation,
  notifyOrderStatus,
  notifyLeadCreated,
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
