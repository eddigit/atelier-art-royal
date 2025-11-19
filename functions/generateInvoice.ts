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
    
    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(229, 179, 80);
    doc.text('ATELIER ART ROYAL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Haute Couture Maçonnique - Made in France', 105, 28, { align: 'center' });
    
    // Informations facture
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('FACTURE', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Facture N° ${order.order_number}`, 20, 60);
    doc.text(`Date: ${new Date(order.created_date).toLocaleDateString('fr-FR')}`, 20, 67);
    
    // Informations client
    doc.text('Facturation:', 120, 60);
    doc.text(customer.full_name || 'Client', 120, 67);
    doc.text(customer.email, 120, 74);
    if (order.billing_address) {
      doc.text(order.billing_address.street || '', 120, 81);
      doc.text(`${order.billing_address.postal_code || ''} ${order.billing_address.city || ''}`, 120, 88);
    }
    
    // Tableau des produits
    let y = 110;
    doc.setFillColor(229, 179, 80);
    doc.rect(20, y - 7, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Produit', 25, y);
    doc.text('Qté', 120, y);
    doc.text('Prix Unit.', 140, y);
    doc.text('Total', 170, y);
    
    y += 10;
    doc.setTextColor(0);
    
    order.items?.forEach(item => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.product_name, 25, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${item.price.toFixed(2)}€`, 140, y);
      doc.text(`${item.total.toFixed(2)}€`, 170, y);
      y += 8;
    });
    
    // Totaux
    y += 10;
    doc.setDrawColor(200);
    doc.line(120, y, 190, y);
    y += 8;
    
    doc.text('Sous-total:', 120, y);
    doc.text(`${order.subtotal?.toFixed(2) || order.total?.toFixed(2)}€`, 170, y);
    y += 8;
    
    doc.text('Livraison:', 120, y);
    doc.text(`${order.shipping_cost?.toFixed(2) || 0}€`, 170, y);
    y += 8;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL TTC:', 120, y);
    doc.text(`${order.total.toFixed(2)}€`, 170, y);
    
    // Pied de page
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text('Atelier Art Royal - contact@artroyal.fr - +33 6 46 68 36 10', 105, 280, { align: 'center' });
    
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