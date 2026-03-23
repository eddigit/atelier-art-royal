import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    
    // Récupérer la commande
    const orders = await base44.entities.Order.filter({ id: orderId });
    if (orders.length === 0) {
      return Response.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    const order = orders[0];
    
    // Vérifier que l'utilisateur est admin ou propriétaire de la commande
    if (user.role !== 'admin' && order.customer_id !== user.id) {
      return Response.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les infos client
    const customers = await base44.asServiceRole.entities.User.filter({ id: order.customer_id });
    const customer = customers[0];

    // Créer le PDF
    const doc = new jsPDF();
    
    // Couleurs de la marque
    const primaryGold = [229, 179, 80];
    const darkGray = [50, 50, 50];
    const lightGray = [150, 150, 150];
    const veryLightGray = [245, 245, 245];
    
    // Bordure dorée élégante
    doc.setDrawColor(...primaryGold);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
    
    // Logo (en base64 ou URL - j'utilise un rectangle décoratif pour l'instant)
    doc.setFillColor(...primaryGold);
    doc.roundedRect(15, 15, 35, 35, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ATELIER', 32.5, 28, { align: 'center' });
    doc.text('ART ROYAL', 32.5, 35, { align: 'center' });
    doc.setFontSize(6);
    doc.text('Made in France', 32.5, 42, { align: 'center' });
    
    // En-tête entreprise
    doc.setFontSize(18);
    doc.setTextColor(...primaryGold);
    doc.setFont(undefined, 'bold');
    doc.text('ATELIER ART ROYAL', 55, 25);
    
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.setFont(undefined, 'normal');
    doc.text('Haute Couture Maçonnique', 55, 32);
    doc.text('contact@artroyal.fr', 55, 38);
    doc.text('+33 6 46 68 36 10', 55, 44);
    
    // FACTURE - Grand titre
    doc.setFillColor(...veryLightGray);
    doc.rect(15, 58, 180, 12, 'F');
    doc.setFontSize(20);
    doc.setTextColor(...primaryGold);
    doc.setFont(undefined, 'bold');
    doc.text('FACTURE', 105, 66, { align: 'center' });
    
    // Informations facture dans un encadré
    doc.setDrawColor(...primaryGold);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 75, 85, 30, 2, 2);
    
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.setFont(undefined, 'bold');
    doc.text('N° de Facture:', 20, 83);
    doc.setFont(undefined, 'normal');
    doc.text(order.order_number || 'N/A', 20, 90);
    
    doc.setFont(undefined, 'bold');
    doc.text('Date d\'émission:', 20, 97);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(order.created_date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }), 20, 103);
    
    // Informations client dans un encadré
    doc.roundedRect(110, 75, 85, 45, 2, 2);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryGold);
    doc.text('FACTURÉ À:', 115, 83);
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...darkGray);
    doc.setFontSize(11);
    doc.text(customer.full_name || 'Client', 115, 91);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(customer.email || '', 115, 97);
    
    if (order.billing_address) {
      doc.text(order.billing_address.street || '', 115, 103);
      doc.text(`${order.billing_address.postal_code || ''} ${order.billing_address.city || ''}`, 115, 109);
      doc.text(order.billing_address.country || 'France', 115, 115);
    }
    
    // Tableau des produits - En-tête avec style
    let y = 135;
    doc.setFillColor(...primaryGold);
    doc.roundedRect(15, y - 8, 180, 10, 1, 1, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION', 20, y);
    doc.text('QTÉ', 125, y, { align: 'center' });
    doc.text('PRIX UNIT.', 150, y, { align: 'center' });
    doc.text('TOTAL', 180, y, { align: 'right' });
    
    // Lignes de produits avec alternance de couleurs
    y += 10;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    order.items?.forEach((item, index) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      
      // Alternance de couleur de fond
      if (index % 2 === 0) {
        doc.setFillColor(...veryLightGray);
        doc.rect(15, y - 5, 180, 8, 'F');
      }
      
      doc.setTextColor(...darkGray);
      doc.text(item.product_name, 20, y);
      doc.text(item.quantity.toString(), 125, y, { align: 'center' });
      doc.text(`${item.price.toFixed(2)} €`, 150, y, { align: 'center' });
      doc.text(`${item.total.toFixed(2)} €`, 180, y, { align: 'right' });
      
      y += 8;
    });
    
    // Séparation avant totaux
    y += 5;
    doc.setDrawColor(...primaryGold);
    doc.setLineWidth(0.5);
    doc.line(110, y, 190, y);
    
    // Totaux dans un style épuré
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    
    doc.text('Sous-total HT:', 130, y);
    doc.text(`${(order.subtotal || order.total)?.toFixed(2)} €`, 180, y, { align: 'right' });
    y += 7;
    
    doc.text('Frais de livraison:', 130, y);
    doc.text(`${(order.shipping_cost || 0).toFixed(2)} €`, 180, y, { align: 'right' });
    y += 7;
    
    doc.text('TVA (20%):', 130, y);
    const tva = (order.total * 0.20) / 1.20;
    doc.text(`${tva.toFixed(2)} €`, 180, y, { align: 'right' });
    y += 10;
    
    // Total TTC - Mise en valeur
    doc.setFillColor(...primaryGold);
    doc.roundedRect(110, y - 5, 85, 12, 2, 2, 'F');
    
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL TTC:', 130, y + 3);
    doc.setFontSize(14);
    doc.text(`${order.total.toFixed(2)} €`, 180, y + 3, { align: 'right' });
    
    // Pied de page élégant
    doc.setDrawColor(...primaryGold);
    doc.setLineWidth(0.3);
    doc.line(15, 270, 195, 270);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...lightGray);
    doc.text('Atelier Art Royal • Haute Couture Maçonnique Made in France', 105, 275, { align: 'center' });
    doc.text('contact@artroyal.fr • +33 6 46 68 36 10', 105, 280, { align: 'center' });
    doc.text('Merci de votre confiance', 105, 285, { align: 'center' });
    
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=facture-${order.order_number}.pdf`
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});