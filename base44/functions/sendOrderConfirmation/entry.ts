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
      <tr style="background: #ffffff;">
        <td style="padding: 14px 12px; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-size: 14px;">${item.product_name}</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #1a1a1a; font-size: 14px; font-weight: bold;">${item.quantity}</td>
        <td class="mobile-hide" style="padding: 14px 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #666; font-size: 14px;">${item.price.toFixed(2)}€</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #1a1a1a; font-size: 14px;">${item.total.toFixed(2)}€</td>
      </tr>
    `).join('');

    // Instructions de paiement selon la méthode
    let paymentInstructions = '';
    if (order.payment_method === 'bank_transfer') {
      paymentInstructions = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); border-radius: 12px; border: 2px solid #ffc107; margin: 25px 0;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">💳 Coordonnées bancaires</h3>
              <table width="100%" cellpadding="6" cellspacing="0">
                <tr>
                  <td style="color: #856404; font-size: 14px; font-weight: bold;">Titulaire :</td>
                  <td style="color: #856404; font-size: 14px; text-align: right;">Atelier Art Royal</td>
                </tr>
                <tr>
                  <td style="color: #856404; font-size: 14px; font-weight: bold;">IBAN :</td>
                  <td style="color: #856404; font-size: 14px; text-align: right; font-family: monospace;">FR76 XXXX XXXX XXXX XXXX XXXX XXX</td>
                </tr>
                <tr>
                  <td style="color: #856404; font-size: 14px; font-weight: bold;">BIC :</td>
                  <td style="color: #856404; font-size: 14px; text-align: right; font-family: monospace;">XXXXXXXX</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 15px; border-top: 1px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">Référence à indiquer : <span style="color: #d97706;">${order.order_number}</span></p>
                  </td>
                </tr>
              </table>
              <p style="color: #856404; font-size: 13px; margin: 15px 0 0 0; line-height: 1.6;">
                ⚠️ <strong>Important :</strong> Merci d'indiquer la référence de commande dans le libellé du virement pour un traitement rapide.
              </p>
            </td>
          </tr>
        </table>
      `;
    } else if (order.payment_method === 'cash') {
      paymentInstructions = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; border: 2px solid #28a745; margin: 25px 0;">
          <tr>
            <td style="padding: 20px;">
              <h3 style="color: #155724; margin: 0 0 12px 0; font-size: 18px; font-weight: bold;">💶 Paiement en espèces</h3>
              <p style="margin: 0 0 15px 0; color: #155724; font-size: 14px; line-height: 1.6;">
                Le paiement sera à effectuer lors du retrait en atelier.
              </p>
              <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.8;">
                <strong>📍 Coordonnées de l'atelier :</strong><br>
                Adresse : [À COMPLÉTER]<br>
                📞 Téléphone : <a href="tel:+33646683610" style="color: #155724; text-decoration: none; font-weight: bold;">+33 6 46 68 36 10</a>
              </p>
              <p style="color: #155724; font-size: 13px; margin: 15px 0 0 0; line-height: 1.6;">
                ⚠️ Merci de prendre rendez-vous avant votre venue.
              </p>
            </td>
          </tr>
        </table>
      `;
    } else if (order.payment_method === 'card') {
      paymentInstructions = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; border: 2px solid #28a745; margin: 25px 0;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">✅ Paiement par carte bancaire</h3>
              <p style="margin: 0; color: #155724; font-size: 14px; line-height: 1.6;">
                Votre paiement a été traité avec succès. Votre commande est en cours de préparation.
              </p>
            </td>
          </tr>
        </table>
      `;
    }
    
    const emailBody = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de commande</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .header { padding: 20px !important; }
            .content { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 18px !important; }
            table { font-size: 14px !important; }
            .mobile-hide { display: none !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table class="container" width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td class="header" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #e5b350; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">Atelier Art Royal</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Haute Couture Maçonnique • Made in France 🇫🇷</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td class="content" style="padding: 40px 30px; background: #ffffff;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">Bonjour ${customerName},</h2>
                    
                    <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0 0 25px 0;">
                      Nous vous remercions pour votre confiance. Votre commande a été enregistrée avec succès et sera traitée dans les plus brefs délais.
                    </p>
                    
                    <!-- Order Summary Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%); border-radius: 12px; border: 2px solid #e5b350; margin: 25px 0;">
                      <tr>
                        <td style="padding: 25px;">
                          <h3 style="color: #e5b350; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📦 Récapitulatif de commande</h3>
                          <table width="100%" cellpadding="5" cellspacing="0">
                            <tr>
                              <td style="color: #666; font-size: 14px; padding: 8px 0;">Numéro de commande</td>
                              <td align="right" style="font-weight: bold; color: #1a1a1a; font-size: 14px; padding: 8px 0;">${order.order_number}</td>
                            </tr>
                            <tr>
                              <td style="color: #666; font-size: 14px; padding: 8px 0;">Date</td>
                              <td align="right" style="font-weight: bold; color: #1a1a1a; font-size: 14px; padding: 8px 0;">${new Date(order.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                            </tr>
                            <tr>
                              <td style="color: #666; font-size: 14px; padding: 8px 0;">Mode de paiement</td>
                              <td align="right" style="font-weight: bold; color: #1a1a1a; font-size: 14px; padding: 8px 0;">${order.payment_method === 'bank_transfer' ? '🏦 Virement bancaire' : order.payment_method === 'cash' ? '💶 Espèces' : '💳 Carte bancaire'}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${paymentInstructions}
                    
                    <!-- Products Table -->
                    <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; font-weight: bold;">Vos articles :</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 20px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5b350; color: #1a1a1a; font-size: 14px; font-weight: bold;">Produit</th>
                          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5b350; color: #1a1a1a; font-size: 14px; font-weight: bold;">Qté</th>
                          <th class="mobile-hide" style="padding: 12px; text-align: right; border-bottom: 2px solid #e5b350; color: #1a1a1a; font-size: 14px; font-weight: bold;">P.U.</th>
                          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5b350; color: #1a1a1a; font-size: 14px; font-weight: bold;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                        <tr style="background: #fafafa;">
                          <td colspan="3" style="padding: 12px; text-align: right; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0;"><strong>Sous-total :</strong></td>
                          <td style="padding: 12px; text-align: right; font-weight: bold; color: #1a1a1a; font-size: 14px; border-top: 1px solid #e0e0e0;">${order.subtotal.toFixed(2)}€</td>
                        </tr>
                        <tr style="background: #fafafa;">
                          <td colspan="3" style="padding: 12px; text-align: right; color: #666; font-size: 14px;">Livraison :</td>
                          <td style="padding: 12px; text-align: right; color: #1a1a1a; font-size: 14px;">${order.shipping_cost === 0 ? '<span style="color: #28a745; font-weight: bold;">Gratuit</span>' : order.shipping_cost.toFixed(2) + '€'}</td>
                        </tr>
                        <tr style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);">
                          <td colspan="3" style="padding: 18px 12px; text-align: right; font-size: 18px; color: #ffffff; font-weight: bold;">TOTAL TTC :</td>
                          <td style="padding: 18px 12px; text-align: right; font-size: 20px; color: #e5b350; font-weight: bold;">${order.total.toFixed(2)}€</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <!-- Shipping Address -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; border-left: 5px solid #2196F3; margin: 25px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <h4 style="color: #1565C0; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">📍 Adresse de livraison</h4>
                          <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #01579b;">
                            <strong>${order.shipping_address.name}</strong><br>
                            ${order.shipping_address.street}<br>
                            ${order.shipping_address.postal_code} ${order.shipping_address.city}<br>
                            📞 ${order.shipping_address.phone}
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${order.payment_method === 'bank_transfer' ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); border-radius: 12px; border: 2px solid #ffc107; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h4 style="color: #856404; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">⏱️ Prochaines étapes</h4>
                            <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #856404;">
                              <li style="margin-bottom: 8px;">Effectuez le virement bancaire avec la référence de commande</li>
                              <li style="margin-bottom: 8px;">Votre commande sera mise en production dès réception du paiement</li>
                              <li style="margin-bottom: 8px;">Vous recevrez une confirmation d'expédition par email</li>
                              <li style="margin-bottom: 0;">Délai de livraison : 5-7 jours ouvrés après validation du paiement</li>
                            </ol>
                          </td>
                        </tr>
                      </table>
                    ` : ''}
                    
                    <!-- Contact Section -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; margin: 30px 0 0 0;">
                      <tr>
                        <td style="padding: 25px; text-align: center;">
                          <h4 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">Une question sur votre commande ?</h4>
                          <p style="margin: 0 0 12px 0; font-size: 14px; color: #666; line-height: 1.6;">Notre équipe est à votre disposition</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.8;">
                            📧 <a href="mailto:contact@artroyal.fr" style="color: #e5b350; text-decoration: none; font-weight: bold;">contact@artroyal.fr</a><br>
                            📞 <a href="tel:+33646683610" style="color: #e5b350; text-decoration: none; font-weight: bold;">+33 6 46 68 36 10</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; font-size: 15px; line-height: 1.8; text-align: center;">
                      Cordialement,<br>
                      <strong style="color: #e5b350; font-size: 16px;">L'équipe Atelier Art Royal</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); padding: 30px 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #e5b350; font-weight: bold;">Atelier Art Royal</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #aaa;">Haute Couture Maçonnique • Made in France 🇫🇷</p>
                    <p style="margin: 0; font-size: 11px; color: #888;">
                      <a href="mailto:contact@artroyal.fr" style="color: #888; text-decoration: none;">contact@artroyal.fr</a> • 
                      <a href="tel:+33646683610" style="color: #888; text-decoration: none;">+33 6 46 68 36 10</a>
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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