import { requireAuth } from '../lib/auth.js';
import { sendEmail } from '../lib/ses.js';
import { query } from '../lib/db.js';
import { emailLayout, goldButton, SITE_URL } from '../lib/emailTemplate.js';

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
  const isPaid = checkout.status === 'PAID';

  // If paid, update order payment_status in DB
  if (isPaid && checkout.checkout_reference) {
    try {
      await query(
        "UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = $1 AND payment_status != 'paid'",
        [checkout.checkout_reference]
      );
    } catch (err) {
      console.error('Failed to update payment_status:', err);
    }
  }

  return res.status(200).json({
    success: true, status: checkout.status, transactionId: checkout.transaction_id,
    amount: checkout.amount, currency: checkout.currency, paid: isPaid,
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

    // Get customer info
    let customerEmail = null;
    let customerName = '';
    if (order.customer_id) {
      const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [order.customer_id]);
      if (userResult.rows.length > 0) {
        customerEmail = userResult.rows[0].email;
        customerName = userResult.rows[0].full_name || '';
      }
    }

    const items = order.items || [];
    const itemsHtml = items.map(i =>
      `<tr>
        <td style="padding:10px;border-bottom:1px solid #eee">${i.product_name || 'Produit'}${i.product_sku ? '<br><span style="font-size:11px;color:#999">Réf: ' + i.product_sku + '</span>' : ''}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity || 1}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${(i.total || i.price || 0).toFixed(2)}&euro;</td>
      </tr>`
    ).join('');

    const paymentLabels = {
      bank_transfer: 'Virement bancaire',
      cash: 'Espèces / Retrait en atelier',
      card: 'Carte bancaire',
    };
    const paymentLabel = paymentLabels[order.payment_method] || order.payment_method || 'Non précisé';

    const shippingAddr = order.shipping_address;
    const shippingHtml = shippingAddr ? `
      <div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:6px">
        <h3 style="margin:0 0 8px;color:#1a1a2e;font-size:14px">Adresse de livraison</h3>
        <p style="margin:0;color:#555;font-size:13px">
          ${shippingAddr.name || customerName}<br>
          ${shippingAddr.street || ''}<br>
          ${shippingAddr.postal_code || ''} ${shippingAddr.city || ''}<br>
          ${shippingAddr.phone ? 'Tél : ' + shippingAddr.phone : ''}
        </p>
      </div>` : '';

    const html = emailLayout({
      title: 'Confirmation de commande',
      body: `
        <p>Bonjour${customerName ? ' <strong>' + customerName + '</strong>' : ''},</p>
        <p>Merci pour votre commande <strong>${order.order_number}</strong> !</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead><tr style="background:#1a1a2e">
            <th style="padding:10px;text-align:left;color:#c9a84c;font-size:13px">Produit</th>
            <th style="padding:10px;text-align:center;color:#c9a84c;font-size:13px">Qté</th>
            <th style="padding:10px;text-align:right;color:#c9a84c;font-size:13px">Total</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <table style="width:100%;margin:0 0 20px">
          ${order.subtotal ? `<tr><td style="padding:4px 0;color:#666;font-size:13px">Sous-total</td><td style="text-align:right;font-size:13px">${(order.subtotal || 0).toFixed(2)}&euro;</td></tr>` : ''}
          ${order.shipping_cost ? `<tr><td style="padding:4px 0;color:#666;font-size:13px">Frais de port</td><td style="text-align:right;font-size:13px">${(order.shipping_cost || 0).toFixed(2)}&euro;</td></tr>` : ''}
          <tr><td style="padding:8px 0;font-weight:700;font-size:16px;border-top:2px solid #1a1a2e">Total</td><td style="text-align:right;font-weight:700;font-size:16px;border-top:2px solid #1a1a2e;color:#c9a84c">${(order.total || 0).toFixed(2)}&euro;</td></tr>
        </table>
        <p style="font-size:13px;color:#555"><strong>Mode de paiement :</strong> ${paymentLabel}</p>
        ${shippingHtml}
        ${goldButton(SITE_URL + '/Orders', 'Suivre ma commande')}
        <p style="color:#666;font-size:13px">Vous recevrez un email dès l'expédition de votre commande.</p>
        <p style="color:#666;font-size:13px">Pour toute question : <a href="mailto:contact@artroyal.fr" style="color:#c9a84c">contact@artroyal.fr</a> ou <strong>+33 6 46 68 36 10</strong></p>
      `
    });

    const results = [];

    // Send to customer
    if (customerEmail) {
      const r = await sendEmail({
        to: customerEmail,
        subject: `Confirmation de commande ${order.order_number} — Atelier Art Royal`,
        bodyHtml: html,
        bodyText: `Merci pour votre commande ${order.order_number} ! Total : ${(order.total || 0).toFixed(2)}€. Paiement : ${paymentLabel}. Pour toute question : contact@artroyal.fr`,
      });
      results.push({ to: customerEmail, ...r });
    }

    // Notify shop owner
    const ownerHtml = emailLayout({
      title: 'Nouvelle commande',
      body: `
        <p>Nouvelle commande <strong>${order.order_number}</strong> reçue !</p>
        <p><strong>Total :</strong> ${(order.total || 0).toFixed(2)}&euro;</p>
        <p><strong>Client :</strong> ${customerName || 'N/A'} (${customerEmail || 'inconnu'})</p>
        <p><strong>Paiement :</strong> ${paymentLabel}</p>
        ${goldButton(SITE_URL + '/AdminOrders', 'Voir dans l\'admin')}
      `
    });
    const rOwner = await sendEmail({
      to: 'contact@artroyal.fr',
      subject: `Nouvelle commande ${order.order_number} — ${(order.total || 0).toFixed(2)}€`,
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
    let customerName = '';
    if (order.customer_id) {
      const userResult = await query('SELECT email, full_name FROM users WHERE id = $1', [order.customer_id]);
      if (userResult.rows.length > 0) {
        customerEmail = userResult.rows[0].email;
        customerName = userResult.rows[0].full_name || '';
      }
    }

    if (!customerEmail) return res.status(200).json({ success: true, message: 'No customer email' });

    const currentStatus = status || order.status;

    const statusConfig = {
      processing: {
        label: 'en cours de préparation',
        emoji: '&#128296;',
        message: 'Nos artisans sont au travail ! Votre commande est en cours de fabrication avec le plus grand soin.',
        title: 'Commande en préparation',
      },
      shipped: {
        label: 'expédiée',
        emoji: '&#128666;',
        message: 'Votre colis est en route ! Vous le recevrez dans les prochains jours.',
        title: 'Votre colis est en route !',
      },
      delivered: {
        label: 'livrée',
        emoji: '&#9989;',
        message: 'Votre commande a été livrée ! Nous espérons que vos articles vous donnent entière satisfaction.',
        title: 'Commande livrée !',
      },
      cancelled: {
        label: 'annulée',
        emoji: '&#10060;',
        message: 'Votre commande a été annulée. Si vous avez des questions, n\'hésitez pas à nous contacter.',
        title: 'Commande annulée',
      },
    };

    const cfg = statusConfig[currentStatus] || {
      label: currentStatus,
      emoji: '&#128230;',
      message: `Le statut de votre commande a été mis à jour : ${currentStatus}.`,
      title: 'Mise à jour de commande',
    };

    const trackingNumber = req.body.trackingNumber || order.tracking_number;
    let trackingHtml = '';
    if (currentStatus === 'shipped' && trackingNumber) {
      trackingHtml = `
        <div style="margin:20px 0;padding:16px;background:#f0f7ff;border:1px solid #d0e3ff;border-radius:6px;text-align:center">
          <p style="margin:0 0 8px;font-size:13px;color:#555">Numéro de suivi</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:1px">${trackingNumber}</p>
          <p style="margin:8px 0 0"><a href="https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNumber)}" style="color:#c9a84c;font-size:13px">Suivre mon colis sur La Poste &rarr;</a></p>
        </div>`;
    }

    const html = emailLayout({
      title: cfg.title,
      body: `
        <p>Bonjour${customerName ? ' <strong>' + customerName + '</strong>' : ''},</p>
        <p style="font-size:16px">${cfg.emoji} Votre commande <strong>${order.order_number}</strong> est maintenant <strong>${cfg.label}</strong>.</p>
        <p style="color:#555">${cfg.message}</p>
        ${trackingHtml}
        ${goldButton(SITE_URL + '/Orders', 'Voir ma commande')}
        <p style="color:#666;font-size:13px">Pour toute question : <a href="mailto:contact@artroyal.fr" style="color:#c9a84c">contact@artroyal.fr</a> ou <strong>+33 6 46 68 36 10</strong></p>
      `
    });

    const r = await sendEmail({
      to: customerEmail,
      subject: `Commande ${order.order_number} — ${cfg.label} — Atelier Art Royal`,
      bodyHtml: html,
      bodyText: `Votre commande ${order.order_number} est maintenant ${cfg.label}. ${cfg.message}`,
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

  // Notify admin
  const adminHtml = emailLayout({
    title: 'Nouveau message',
    body: `
      <p><strong>Nom :</strong> ${name || 'N/A'}</p>
      <p><strong>Email :</strong> ${email || 'N/A'}</p>
      <p><strong>Tél :</strong> ${phone || 'N/A'}</p>
      <p><strong>Message :</strong></p>
      <div style="padding:12px;background:#f9f9f9;border-radius:6px;margin:10px 0">${(message || '').replace(/\n/g, '<br>')}</div>
      ${email ? `<p><a href="mailto:${email}" style="color:#c9a84c">Répondre à ${name || email}</a></p>` : ''}
    `
  });

  const results = [];

  const rAdmin = await sendEmail({
    to: 'contact@artroyal.fr',
    subject: `Nouveau message de ${name || email || 'un visiteur'} — artroyal.fr`,
    bodyHtml: adminHtml,
    replyTo: email || undefined,
  });
  results.push({ to: 'contact@artroyal.fr', ...rAdmin });

  // Send acknowledgment to visitor
  if (email) {
    const visitorHtml = emailLayout({
      title: 'Message bien reçu !',
      body: `
        <p>Bonjour${name ? ' <strong>' + name + '</strong>' : ''},</p>
        <p>Nous avons bien reçu votre message et nous vous en remercions.</p>
        <p>Notre équipe reviendra vers vous dans les plus brefs délais, généralement sous 24 à 48 heures.</p>
        <div style="padding:12px;background:#f9f9f9;border-radius:6px;margin:16px 0">
          <p style="margin:0;color:#666;font-size:13px"><strong>Votre message :</strong></p>
          <p style="margin:8px 0 0;color:#333;font-size:13px">${(message || '').replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color:#666;font-size:13px">En attendant, n'hésitez pas à nous appeler au <strong>+33 6 46 68 36 10</strong> pour toute urgence.</p>
        <p style="color:#666;font-size:13px">Cordialement,<br><strong>L'équipe Atelier Art Royal</strong></p>
      `
    });

    const rVisitor = await sendEmail({
      to: email,
      subject: 'Nous avons bien reçu votre message — Atelier Art Royal',
      bodyHtml: visitorHtml,
      bodyText: `Bonjour ${name || ''}, nous avons bien reçu votre message et reviendrons vers vous sous 24-48h. Atelier Art Royal — contact@artroyal.fr`,
    });
    results.push({ to: email, ...rVisitor });
  }

  return res.status(200).json({ success: true, results });
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
