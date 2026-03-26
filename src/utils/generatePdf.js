import { jsPDF } from 'jspdf';

/**
 * Sanitize text for jsPDF default fonts (Latin-1 / WinAnsiEncoding).
 * Replaces characters outside the supported range with closest ASCII equivalents.
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

/**
 * Generate a PDF for an order.
 * @param {Object} order - The order object with items, addresses, totals
 * @param {Object} customer - Customer info { full_name, email }
 * @param {'facture'|'bon_de_commande'} docType - Document type
 */
export function generateOrderPdf(order, customer, docType = 'auto') {
  // Auto-detect document type based on payment status
  if (docType === 'auto') {
    docType = order.payment_status === 'paid' ? 'facture' : 'bon_de_commande';
  }

  const isPaid = docType === 'facture';
  const docTitle = isPaid ? 'FACTURE' : 'BON DE COMMANDE';
  const docPrefix = isPaid ? 'FA' : 'BC';
  const docNumber = `${docPrefix}-${order.order_number || order.id}`;

  const doc = new jsPDF();

  // Colors
  const gold = [195, 154, 68];
  const dark = [50, 50, 50];
  const light = [140, 140, 140];
  const veryLight = [245, 245, 245];

  // ── Border ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);

  // ── Logo area ──
  doc.setFillColor(...gold);
  doc.roundedRect(15, 15, 35, 35, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ATELIER', 32.5, 28, { align: 'center' });
  doc.text('ART ROYAL', 32.5, 35, { align: 'center' });
  doc.setFontSize(6);
  doc.text('Made in France', 32.5, 42, { align: 'center' });

  // ── Company header ──
  doc.setFontSize(18);
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.text('ATELIER ART ROYAL', 55, 25);

  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitize('Haute Couture Ma\u00e7onnique'), 55, 32);
  doc.text('contact@artroyal.fr', 55, 38);
  doc.text('+33 6 46 68 36 10', 55, 44);

  // ── Document title ──
  doc.setFillColor(...veryLight);
  doc.rect(15, 58, 180, 12, 'F');
  doc.setFontSize(20);
  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(docTitle), 105, 67, { align: 'center' });

  // ── Document info box ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 75, 85, 30, 2, 2);

  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitize(isPaid ? 'N\u00b0 de Facture:' : 'N\u00b0 de Commande:'), 20, 83);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitize(docNumber), 20, 90);

  doc.setFont('helvetica', 'bold');
  doc.text(sanitize("Date d'\u00e9mission:"), 20, 97);
  doc.setFont('helvetica', 'normal');
  const dateStr = order.created_date
    ? new Date(order.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(sanitize(dateStr), 20, 103);

  // ── Customer info box ──
  doc.roundedRect(110, 75, 85, 45, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gold);
  doc.text(sanitize(isPaid ? 'FACTUR\u00c9 \u00c0:' : 'COMMAND\u00c9 PAR:'), 115, 83);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.setFontSize(11);
  const custName = customer?.full_name || order.shipping_address?.name || 'Client';
  doc.text(sanitize(custName), 115, 91);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (customer?.email) doc.text(sanitize(customer.email), 115, 97);

  const addr = order.billing_address || order.shipping_address;
  if (addr) {
    let ay = customer?.email ? 103 : 97;
    if (addr.street) { doc.text(sanitize(addr.street), 115, ay); ay += 6; }
    if (addr.postal_code || addr.city) {
      doc.text(sanitize(`${addr.postal_code || ''} ${addr.city || ''}`), 115, ay);
      ay += 6;
    }
    doc.text(sanitize(addr.country || 'France'), 115, ay);
  }

  // ── Products table header ──
  let y = 135;
  doc.setFillColor(...gold);
  doc.roundedRect(15, y - 8, 180, 10, 1, 1, 'F');

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 20, y);
  doc.text(sanitize('R\u00c9F.'), 95, y);
  doc.text(sanitize('QT\u00c9'), 120, y, { align: 'center' });
  doc.text('PRIX UNIT.', 148, y, { align: 'center' });
  doc.text('TOTAL', 185, y, { align: 'right' });

  // ── Product rows ──
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  (order.items || []).forEach((item, index) => {
    if (y > 248) {
      doc.addPage();
      // Re-draw border on new page
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277);
      y = 25;
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(...veryLight);
      doc.rect(15, y - 4, 180, 12, 'F');
    }

    doc.setTextColor(...dark);

    // Product name + variants
    let productName = item.product_name || 'Produit';
    const variants = [item.selected_size, item.selected_color, item.selected_material].filter(Boolean);

    doc.setFont('helvetica', 'bold');
    doc.text(sanitize(productName.substring(0, 40)), 20, y);

    if (variants.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...light);
      doc.text(sanitize(variants.join(' / ')), 20, y + 5);
      doc.setTextColor(...dark);
      doc.setFontSize(8);
    }

    doc.setFont('helvetica', 'normal');
    doc.text(sanitize(item.product_sku || '-'), 95, y);
    doc.text(String(item.quantity || 1), 120, y, { align: 'center' });
    doc.text(sanitize(`${(item.price || 0).toFixed(2)} \u20ac`), 148, y, { align: 'center' });
    doc.text(sanitize(`${(item.total || 0).toFixed(2)} \u20ac`), 185, y, { align: 'right' });

    y += variants.length > 0 ? 14 : 10;
  });

  // ── Totals ──
  y += 5;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(110, y, 195, y);

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...dark);

  doc.text('Sous-total HT:', 130, y);
  const subtotalHT = ((order.subtotal || order.total || 0) / 1.20);
  doc.text(sanitize(`${subtotalHT.toFixed(2)} \u20ac`), 185, y, { align: 'right' });
  y += 7;

  doc.text('Frais de livraison:', 130, y);
  doc.text(sanitize(`${(order.shipping_cost || 0).toFixed(2)} \u20ac`), 185, y, { align: 'right' });
  y += 7;

  doc.text('TVA (20%):', 130, y);
  const tva = (order.total || 0) - subtotalHT - (order.shipping_cost || 0);
  doc.text(sanitize(`${Math.max(0, tva).toFixed(2)} \u20ac`), 185, y, { align: 'right' });
  y += 10;

  // ── Total TTC box ──
  doc.setFillColor(...gold);
  doc.roundedRect(110, y - 5, 85, 12, 2, 2, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TTC:', 130, y + 3);
  doc.setFontSize(13);
  doc.text(sanitize(`${(order.total || 0).toFixed(2)} \u20ac`), 185, y + 3, { align: 'right' });

  // ── Payment status note ──
  if (!isPaid) {
    y += 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 50, 50);
    doc.text(sanitize('En attente de paiement'), 105, y, { align: 'center' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...dark);

    if (order.payment_method === 'bank_transfer') {
      doc.text(sanitize('Merci d\'effectuer votre virement bancaire. Les d\u00e9tails vous seront communiqu\u00e9s par email.'), 105, y, { align: 'center' });
    } else if (order.payment_method === 'check') {
      doc.text(sanitize('Merci d\'envoyer votre ch\u00e8que. L\'adresse vous sera communiqu\u00e9e par email.'), 105, y, { align: 'center' });
    }
  }

  // ── Footer ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(15, 270, 195, 270);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...light);
  doc.text(sanitize('Atelier Art Royal \u2022 Haute Couture Ma\u00e7onnique Made in France'), 105, 275, { align: 'center' });
  doc.text('contact@artroyal.fr \u2022 +33 6 46 68 36 10', 105, 280, { align: 'center' });
  doc.text(sanitize('Merci de votre confiance'), 105, 285, { align: 'center' });

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
