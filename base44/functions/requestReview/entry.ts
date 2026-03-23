import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { orderId } = await req.json();

    // Fetch order
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (orders.length === 0) {
      return Response.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const order = orders[0];

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return Response.json({ error: 'La commande doit être livrée' }, { status: 400 });
    }

    // Fetch customer
    let customerEmail = null;
    let customerName = 'Client';
    
    if (!order.customer_id.startsWith('guest_')) {
      const customers = await base44.asServiceRole.entities.User.filter({ id: order.customer_id });
      if (customers.length > 0) {
        customerEmail = customers[0].email;
        customerName = customers[0].full_name || 'Client';
      }
    } else {
      customerEmail = order.shipping_address?.email || null;
      customerName = order.shipping_address?.name || 'Client';
    }

    if (!customerEmail) {
      return Response.json({ error: 'Email client non trouvé' }, { status: 400 });
    }

    // Build review links for each product
    const productLinks = order.items.map(item => {
      const reviewUrl = `${Deno.env.get('BASE44_APP_URL') || 'https://votre-site.fr'}/ProductDetail?id=${item.product_id}#avis`;
      return `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1a1a1a;">${item.product_name}</h3>
          <a href="${reviewUrl}" style="display: inline-block; background: #e5b350; color: #1a1a1a; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Laisser un avis
          </a>
        </div>
      `;
    }).join('');

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
          <h1 style="color: #e5b350; margin: 0;">Atelier Art Royal</h1>
          <p style="color: #ffffff; margin: 5px 0;">Haute Couture Maçonnique</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Bonjour ${customerName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Nous espérons que vous êtes pleinement satisfait de votre commande <strong>${order.order_number}</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Votre avis compte énormément pour nous et pour la communauté. Il nous aide à continuer d'offrir des créations d'exception et guide d'autres frères dans leurs choix.
          </p>

          <div style="background: #f8f9fa; border-left: 4px solid #e5b350; padding: 20px; margin: 20px 0;">
            <h3 style="color: #e5b350; margin-top: 0;">⭐ Partagez votre expérience</h3>
            <p style="margin: 10px 0; font-size: 14px; color: #666;">
              Cliquez sur un produit ci-dessous pour laisser votre avis :
            </p>
            ${productLinks}
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Merci pour votre confiance et votre fidélité.
          </p>
          
          <p style="margin-top: 30px;">
            Fraternellement,<br>
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

    // Send email to customer
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Atelier Art Royal',
      to: customerEmail,
      subject: '⭐ Votre avis nous intéresse - Commande ' + order.order_number,
      body: emailBody
    });

    // Notify admins
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Atelier Art Royal',
      to: 'contact@artroyal.fr',
      subject: `[AVIS] Demande envoyée - ${order.order_number}`,
      body: `Demande d'avis envoyée à ${customerEmail} pour la commande ${order.order_number}`
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Atelier Art Royal',
      to: 'coachdigitalparis@gmail.com',
      subject: `[COPIE] Demande d'avis - ${order.order_number}`,
      body: `Demande d'avis envoyée à ${customerEmail} pour la commande ${order.order_number}`
    });

    return Response.json({
      success: true,
      message: 'Email de demande d\'avis envoyé'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});