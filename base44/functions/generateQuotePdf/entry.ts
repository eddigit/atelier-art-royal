import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quoteId } = await req.json();
    
    if (!quoteId) {
      return Response.json({ error: 'quoteId is required' }, { status: 400 });
    }

    // Récupérer le devis
    const quotes = await base44.asServiceRole.entities.Quote.filter({ id: quoteId });
    const quote = quotes[0];
    
    if (!quote) {
      return Response.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Créer le PDF
    const doc = new jsPDF();
    let y = 20;

    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(229, 179, 80); // Primary color
    doc.text('DEVIS', 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Devis N° ${quote.quote_number}`, 20, y + 8);
    doc.text(`Date: ${new Date(quote.created_date).toLocaleDateString('fr-FR')}`, 20, y + 14);
    if (quote.valid_until) {
      doc.text(`Valable jusqu'au: ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}`, 20, y + 20);
      y += 6;
    }
    
    y += 35;

    // Informations entreprise (gauche)
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Atelier Art Royal', 20, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('contact@artroyal.fr', 20, y + 5);
    doc.text('+33 6 46 68 36 10', 20, y + 10);

    // Informations client (droite)
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Client:', 120, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(quote.customer_name || 'N/A', 120, y + 5);
    if (quote.customer_email) {
      doc.text(quote.customer_email, 120, y + 10);
    }
    if (quote.customer_phone) {
      doc.text(quote.customer_phone, 120, y + 15);
    }

    y += 35;

    // Tableau des produits
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    
    // En-têtes du tableau
    doc.text('Désignation', 20, y);
    doc.text('Qté', 120, y);
    doc.text('P.U.', 145, y);
    doc.text('Total', 175, y);
    
    y += 2;
    doc.line(20, y, 190, y);
    y += 6;

    // Lignes du tableau
    doc.setFont(undefined, 'normal');
    quote.items?.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(item.product_name || 'Produit', 20, y);
      if (item.description) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(item.description.substring(0, 60), 20, y + 4);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        y += 4;
      }
      
      doc.text(String(item.quantity || 1), 120, y);
      doc.text(`${(item.price || 0).toFixed(2)} €`, 145, y);
      doc.text(`${(item.total || 0).toFixed(2)} €`, 175, y);
      y += 8;
    });

    y += 5;
    doc.line(20, y, 190, y);
    y += 8;

    // Totaux
    doc.setFont(undefined, 'normal');
    doc.text('Sous-total HT:', 130, y);
    doc.text(`${(quote.subtotal || 0).toFixed(2)} €`, 175, y);
    y += 6;

    if (quote.shipping_cost > 0) {
      doc.text('Frais de port:', 130, y);
      doc.text(`${quote.shipping_cost.toFixed(2)} €`, 175, y);
      y += 6;
    }

    if (quote.discount > 0) {
      doc.text('Remise:', 130, y);
      doc.text(`-${quote.discount.toFixed(2)} €`, 175, y);
      y += 6;
    }

    doc.text(`TVA (${quote.tax_rate || 20}%):`, 130, y);
    doc.text(`${(quote.tax_amount || 0).toFixed(2)} €`, 175, y);
    y += 8;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total TTC:', 130, y);
    doc.text(`${(quote.total || 0).toFixed(2)} €`, 175, y);

    // Notes
    if (quote.notes) {
      y += 15;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', 20, y);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(quote.notes, 170);
      doc.text(lines, 20, y + 5);
    }

    // Conditions générales
    y = 270;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Ce devis est valable 30 jours à compter de la date d\'émission.', 20, y);
    doc.text('Conditions de paiement : À la commande', 20, y + 4);

    // Générer le PDF
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Upload to storage
    const fileName = `devis-${quote.quote_number}-${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Mettre à jour le devis avec l'URL du PDF
    await base44.asServiceRole.entities.Quote.update(quoteId, { pdf_url: file_url });

    return Response.json({ 
      success: true,
      pdfUrl: file_url
    });

  } catch (error) {
    console.error('Error generating quote PDF:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});