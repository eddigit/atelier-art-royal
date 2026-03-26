import { jsPDF } from 'jspdf';
import { LOGO_BASE64 } from './logoBase64';

/**
 * Sanitize text for jsPDF default fonts (Latin-1 / WinAnsiEncoding).
 */
function sanitize(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u00A0/g, ' ');
}

/** Safe number conversion */
function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

/**
 * Generate a modern, elegant PDF for an order.
 * Design: Black & white with subtle gold accents — premium feel.
 */
export function generateOrderPdf(order, customer, docType = 'auto') {
  if (docType === 'auto') {
    docType = order.payment_status === 'paid' ? 'facture' : 'bon_de_commande';
  }

  const isPaid = docType === 'facture';
  const docTitle = isPaid ? 'FACTURE' : 'BON DE COMMANDE';
  const docPrefix = isPaid ? 'FA' : 'BC';
  const docNumber = `${docPrefix}-${order.order_number || order.id}`;

  const doc = new jsPDF();
  const pw = 210; // page width
  const ph = 297; // page height
  const ml = 20;  // margin left
  const mr = 20;  // margin right
  const cw = pw - ml - mr; // content width

  // Colors
  const black = [25, 25, 25];
  const darkGray = [60, 60, 60];
  const medGray = [120, 120, 120];
  const lightGray = [200, 200, 200];
  const bgLight = [248, 248, 248];
  const accent = [180, 150, 80]; // subtle gold

  // ─────────────────────────────────────────────
  // HEADER — Logo + Company info
  // ─────────────────────────────────────────────
  let y = 18;

  // Logo (854x124 ratio → ~80x12)
  try {
    doc.addImage(LOGO_BASE64, 'JPEG', ml, y, 80, 12);
  } catch {
    // Fallback text if image fails
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'bold');
    doc.text('Atelier Art Royal', ml, y + 8);
  }

  // Company details — right aligned
  doc.setFontSize(8);
  doc.setTextColor(...medGray);
  doc.setFont('helvetica', 'normal');
  const companyLines = [
    'contact@artroyal.fr',
    '+33 6 46 68 36 10',
    'La Haute Couture de la Franc-Maconnerie',
  ];
  companyLines.forEach((line, i) => {
    doc.text(sanitize(line), pw - mr, y + 3 + i * 4, { align: 'right' });
  });

  // Thin accent line under header
  y += 20;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.line(ml, y, pw - mr, y);

  // ─────────────────────────────────────────────
  // DOCUMENT TITLE
  // ─────────────────────────────────────────────
  y += 12;
  doc.setFontSize(22);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(docTitle), ml, y);

  // Document number + date — right
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitize(docNumber), pw - mr, y - 6, { align: 'right' });

  const dateStr = order.created_date
    ? new Date(order.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(sanitize(dateStr), pw - mr, y, { align: 'right' });

  // ─────────────────────────────────────────────
  // CLIENT INFO BOX
  // ─────────────────────────────────────────────
  y += 12;

  // Light background box
  doc.setFillColor(...bgLight);
  doc.roundedRect(pw / 2 + 5, y - 5, cw / 2 - 5, 35, 2, 2, 'F');

  // Label
  doc.setFontSize(7);
  doc.setTextColor(...medGray);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(isPaid ? 'FACTURE A :' : 'COMMANDE PAR :'), pw / 2 + 10, y + 1);

  // Client name
  const custName = customer?.full_name || order.shipping_address?.name || 'Client';
  doc.setFontSize(11);
  doc.setTextColor(...black);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(custName), pw / 2 + 10, y + 8);

  // Client details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  let cy = y + 14;
  if (customer?.email) {
    doc.text(sanitize(customer.email), pw / 2 + 10, cy);
    cy += 5;
  }
  const addr = order.billing_address || order.shipping_address;
  if (addr) {
    if (addr.street) { doc.text(sanitize(addr.street), pw / 2 + 10, cy); cy += 5; }
    if (addr.postal_code || addr.city) {
      doc.text(sanitize(`${addr.postal_code || ''} ${addr.city || ''}`).trim(), pw / 2 + 10, cy);
      cy += 5;
    }
    doc.text(sanitize(addr.country || 'France'), pw / 2 + 10, cy);
  }

  // Payment method on the left
  if (order.payment_method) {
    doc.setFontSize(8);
    doc.setTextColor(...medGray);
    doc.setFont('helvetica', 'normal');
    const methods = {
      card: 'Carte bancaire',
      bank_transfer: 'Virement bancaire',
      check: 'Cheque',
      cash: 'Especes',
      sumup: 'SumUp',
    };
    doc.text(sanitize(`Mode de paiement : ${methods[order.payment_method] || order.payment_method}`), ml, y + 8);
  }

  if (order.payment_status) {
    const statusLabels = {
      paid: 'Payee',
      pending: 'En attente',
      cancelled: 'Annulee',
      refunded: 'Remboursee',
    };
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(order.payment_status === 'paid' ? 40 : 180, order.payment_status === 'paid' ? 140 : 50, order.payment_status === 'paid' ? 40 : 50);
    doc.text(sanitize(`Statut : ${statusLabels[order.payment_status] || order.payment_status}`), ml, y + 14);
  }

  // ─────────────────────────────────────────────
  // PRODUCTS TABLE
  // ─────────────────────────────────────────────
  y += 45;

  // Table header
  doc.setFillColor(...black);
  doc.rect(ml, y - 5, cw, 9, 'F');

  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize('REF.'), ml + 3, y + 1);
  doc.text('DESIGNATION', ml + 30, y + 1);
  doc.text(sanitize('QTE'), 142, y + 1, { align: 'center' });
  doc.text('P.U. HT', 162, y + 1, { align: 'center' });
  doc.text('TOTAL HT', pw - mr - 3, y + 1, { align: 'right' });

  // Table rows
  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const items = order.items || [];
  items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage();
      y = 25;
      // Redraw header on new page
      doc.setFillColor(...black);
      doc.rect(ml, y - 5, cw, 9, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitize('REF.'), ml + 3, y + 1);
      doc.text('DESIGNATION', ml + 30, y + 1);
      doc.text(sanitize('QTE'), 142, y + 1, { align: 'center' });
      doc.text('P.U. HT', 162, y + 1, { align: 'center' });
      doc.text('TOTAL HT', pw - mr - 3, y + 1, { align: 'right' });
      y += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    // Alternating rows
    if (index % 2 === 0) {
      doc.setFillColor(...bgLight);
      doc.rect(ml, y - 4, cw, 12, 'F');
    }

    doc.setTextColor(...darkGray);

    // SKU/Ref
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(sanitize(item.product_sku || '-'), ml + 3, y + 2);

    // Product name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...black);
    doc.text(sanitize((item.product_name || 'Produit').substring(0, 45)), ml + 30, y + 2);

    // Variants
    const variants = [item.selected_size, item.selected_color, item.selected_material].filter(Boolean);
    if (variants.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...medGray);
      doc.text(sanitize(variants.join(' / ')), ml + 30, y + 7);
    }

    // Qty, unit price, total
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text(String(item.quantity || 1), 142, y + 2, { align: 'center' });

    const unitPriceHT = num(item.price) / 1.20;
    const totalHT = num(item.total) / 1.20;
    doc.text(sanitize(`${unitPriceHT.toFixed(2)} \u20ac`), 162, y + 2, { align: 'center' });
    doc.text(sanitize(`${totalHT.toFixed(2)} \u20ac`), pw - mr - 3, y + 2, { align: 'right' });

    y += variants.length > 0 ? 14 : 12;
  });

  // ─────────────────────────────────────────────
  // TOTALS
  // ─────────────────────────────────────────────
  y += 6;

  // Thin line
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(120, y, pw - mr, y);
  y += 7;

  const totalTTC = num(order.total);
  const shippingTTC = num(order.shipping_cost);
  const subtotalTTC = num(order.subtotal) || (totalTTC - shippingTTC);
  const subtotalHT = subtotalTTC / 1.20;
  const shippingHT = shippingTTC / 1.20;
  const totalHT = subtotalHT + shippingHT;
  const totalTVA = totalTTC - totalHT;

  doc.setFontSize(8.5);
  doc.setTextColor(...darkGray);

  // Subtotal HT
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total HT', 130, y);
  doc.text(sanitize(`${subtotalHT.toFixed(2)} \u20ac`), pw - mr - 3, y, { align: 'right' });
  y += 6;

  // Shipping HT
  doc.text('Frais de livraison HT', 130, y);
  doc.text(sanitize(`${shippingHT.toFixed(2)} \u20ac`), pw - mr - 3, y, { align: 'right' });
  y += 6;

  // Total HT
  doc.setFont('helvetica', 'bold');
  doc.text('Total HT', 130, y);
  doc.text(sanitize(`${totalHT.toFixed(2)} \u20ac`), pw - mr - 3, y, { align: 'right' });
  y += 6;

  // TVA
  doc.setFont('helvetica', 'normal');
  doc.text('TVA (20%)', 130, y);
  doc.text(sanitize(`${Math.max(0, totalTVA).toFixed(2)} \u20ac`), pw - mr - 3, y, { align: 'right' });
  y += 8;

  // Total TTC — accent box
  doc.setFillColor(...black);
  doc.roundedRect(120, y - 5, cw - 100, 12, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TTC', 130, y + 3);
  doc.text(sanitize(`${totalTTC.toFixed(2)} \u20ac`), pw - mr - 5, y + 3, { align: 'right' });

  // ─────────────────────────────────────────────
  // PAYMENT NOTE (if unpaid)
  // ─────────────────────────────────────────────
  if (!isPaid) {
    y += 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 50, 50);
    doc.text(sanitize('En attente de paiement'), 105, y, { align: 'center' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);

    if (order.payment_method === 'bank_transfer') {
      doc.text(sanitize('Merci d\'effectuer votre virement bancaire. Les details vous seront communiques par email.'), 105, y, { align: 'center' });
    } else if (order.payment_method === 'check') {
      doc.text(sanitize('Merci d\'envoyer votre cheque. L\'adresse vous sera communiquee par email.'), 105, y, { align: 'center' });
    }
  }

  // ─────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────
  // Gold accent line
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.4);
  doc.line(ml, 272, pw - mr, 272);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...medGray);
  doc.text(sanitize('Atelier Art Royal \u2014 La Haute Couture de la Franc-Maconnerie'), 105, 277, { align: 'center' });
  doc.text('contact@artroyal.fr  |  +33 6 46 68 36 10  |  atelier-art-royal.vercel.app', 105, 282, { align: 'center' });
  doc.text(sanitize('Merci de votre confiance'), 105, 287, { align: 'center' });

  return doc;
}

/**
 * Generate and download a PDF for an order.
 */
export function downloadOrderPdf(order, customer, docType = 'auto') {
  const doc = generateOrderPdf(order, customer, docType);
  const prefix = (docType === 'auto'
    ? (order.payment_status === 'paid' ? 'facture' : 'bon-de-commande')
    : (docType === 'facture' ? 'facture' : 'bon-de-commande'));
  doc.save(`${prefix}-${order.order_number || order.id}.pdf`);
}
