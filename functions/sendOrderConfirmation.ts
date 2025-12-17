import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId } = await req.json();
    
    // Récupérer la commande
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (orders.length === 0) {
      return Response.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    const order = orders[0];
    
    // Récupérer le client
    let customerEmail = null;
    let customerName = 'Client';
    
    if (!order.customer_id.startsWith('guest_')) {
      const customers = await base44.asServiceRole.entities.User.filter({ id: order.customer_id });
      if (customers.length > 0) {
        customerEmail = customers[0].email;
        customerName = customers[0].full_name || 'Client';
      }
    } else {
      // Guest order - use shipping address email if provided
      customerEmail = order.shipping_address?.email || null;
      customerName = order.shipping_address?.name || 'Client';
    }

    if (!customerEmail && order.shipping_address?.email) {
      customerEmail = order.shipping_address.email;
    }
    
    // Préparer les détails des produits
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)}€</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>${item.total.toFixed(2)}€</strong></td>
      </tr>
    `).join('');

    // Instructions de paiement selon la méthode
    let paymentInstructions = '';
    if (order.payment_method === 'bank_transfer') {
      paymentInstructions = `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">💳 Coordonnées bancaires pour le virement</h3>
          <p style="margin: 5px 0;"><strong>Titulaire :</strong> Atelier Art Royal</p>
          <p style="margin: 5px 0;"><strong>IBAN :</strong> FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
          <p style="margin: 5px 0;"><strong>BIC :</strong> XXXXXXXX</p>
          <p style="margin: 15px 0 5px 0;"><strong>Référence à indiquer :</strong> ${order.order_number}</p>
          <p style="color: #856404; font-size: 14px; margin-top: 15px;">
            ⚠️ Important : Merci d'indiquer la référence de commande dans le libellé du virement.
          </p>
        </div>
      `;
    } else if (order.payment_method === 'cash') {
      paymentInstructions = `
        <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">💶 Paiement en espèces</h3>
          <p style="margin: 5px 0;">Paiement à effectuer lors du retrait en atelier</p>
          <p style="margin: 15px 0 5px 0;"><strong>Coordonnées de l'atelier :</strong></p>
          <p style="margin: 5px 0;">📍 Adresse : [À COMPLÉTER]</p>
          <p style="margin: 5px 0;">📞 Téléphone : +33 6 46 68 36 10</p>
          <p style="color: #155724; font-size: 14px; margin-top: 15px;">
            Merci de prendre rendez-vous avant votre venue.
          </p>
        </div>
      `;
    }
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
          <h1 style="color: #e5b350; margin: 0;">Atelier Art Royal</h1>
          <p style="color: #ffffff; margin: 5px 0;">Haute Couture Maçonnique - Made in France</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Bonjour ${customerName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Nous avons bien reçu votre commande et vous en remercions. 
          </p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #e5b350; margin-top: 0;">📦 Détails de la commande</h3>
            <p style="margin: 5px 0;"><strong>Numéro de commande :</strong> ${order.order_number}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date(order.created_date).toLocaleDateString('fr-FR')}</p>
            <p style="margin: 5px 0;"><strong>Mode de paiement :</strong> ${order.payment_method === 'bank_transfer' ? 'Virement bancaire' : order.payment_method === 'cash' ? 'Espèces' : 'Carte bancaire'}</p>
          </div>

          ${paymentInstructions}
          
          <h3 style="color: #1a1a1a;">Articles commandés :</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5b350;">Produit</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5b350;">Qté</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5b350;">Prix Unit.</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5b350;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Sous-total :</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>${order.subtotal.toFixed(2)}€</strong></td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;">Livraison :</td>
                <td style="padding: 10px; text-align: right;">${order.shipping_cost.toFixed(2)}€</td>
              </tr>
              <tr style="background: #f5f5f5;">
                <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>TOTAL TTC :</strong></td>
                <td style="padding: 15px; text-align: right; font-size: 18px; color: #e5b350;"><strong>${order.total.toFixed(2)}€</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div style="background: #e8f4f8; border-left: 4px solid #0288d1; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #01579b;">
              <strong>📍 Adresse de livraison :</strong><br>
              ${order.shipping_address.name}<br>
              ${order.shipping_address.street}<br>
              ${order.shipping_address.postal_code} ${order.shipping_address.city}<br>
              ${order.shipping_address.phone}
            </p>
          </div>

          ${order.payment_method === 'bank_transfer' ? `
            <div style="background: #fff9e6; border: 1px solid #e5b350; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                ⏱️ <strong>Prochaines étapes :</strong><br>
                1. Effectuez le virement bancaire avec la référence de commande<br>
                2. Votre commande sera mise en production dès réception du paiement<br>
                3. Vous recevrez une confirmation d'expédition par email<br>
                4. Délai de livraison : 5-7 jours ouvrés après validation du paiement
              </p>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Pour toute question concernant votre commande, n'hésitez pas à nous contacter :<br>
            📧 Email : <a href="mailto:contact@artroyal.fr" style="color: #e5b350;">contact@artroyal.fr</a><br>
            📞 Téléphone : +33 6 46 68 36 10
          </p>
          
          <p style="margin-top: 30px;">
            Cordialement,<br>
            <strong style="color: #e5b350;">L'équipe Atelier Art Royal</strong>
          </p>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 5px 0;">Atelier Art Royal - Haute Couture Maçonnique</p>
          <p style="margin: 5px 0;">Made in France 🇫🇷</p>
          <p style="margin: 5px 0;">contact@artroyal.fr | +33 6 46 68 36 10</p>
        </div>
      </div>
    `;
    
    // Envoyer au client
    if (customerEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Atelier Art Royal',
        to: customerEmail,
        subject: `Confirmation de commande ${order.order_number}`,
        body: emailBody
      });
    }
    
    // Envoyer copie à l'admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Atelier Art Royal',
      to: 'contact@artroyal.fr',
      subject: `[NOUVELLE COMMANDE] ${order.order_number} - ${customerName}`,
      body: emailBody
    });

    // Envoyer copie au support
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Atelier Art Royal',
      to: 'gilleskorzec@gmail.com',
      subject: `[COPIE] Commande ${order.order_number} - ${customerName}`,
      body: emailBody
    });
    
    return Response.json({ 
      success: true,
      message: 'Emails de confirmation envoyés'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});