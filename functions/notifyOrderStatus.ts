import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const statusMessages = {
  pending: {
    subject: 'Commande reçue',
    message: 'Nous avons bien reçu votre commande. Elle est en cours de traitement.'
  },
  design: {
    subject: 'Commande en design',
    message: 'Votre commande est actuellement en phase de conception. Nos artisans travaillent sur votre création.'
  },
  production: {
    subject: 'Commande en production',
    message: 'Votre commande est maintenant en production. Nos maîtres artisans façonnent votre pièce avec le plus grand soin.'
  },
  quality_control: {
    subject: 'Contrôle qualité',
    message: 'Votre commande passe par notre contrôle qualité rigoureux pour garantir l\'excellence.'
  },
  packaging: {
    subject: 'Préparation de l\'expédition',
    message: 'Votre commande est en cours d\'emballage et sera bientôt expédiée.'
  },
  shipped: {
    subject: 'Commande expédiée',
    message: 'Votre commande a été expédiée ! Vous recevrez votre colis sous 5-7 jours ouvrés.'
  },
  delivered: {
    subject: 'Commande livrée',
    message: 'Votre commande a été livrée. Nous espérons que vous apprécierez votre nouvelle acquisition !'
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status, trackingNumber } = await req.json();
    
    // Récupérer la commande
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    if (orders.length === 0) {
      return Response.json({ error: 'Commande non trouvée' }, { status: 404 });
    }
    
    const order = orders[0];
    
    // Récupérer le client
    const customers = await base44.asServiceRole.entities.User.filter({ id: order.customer_id });
    if (customers.length === 0) {
      return Response.json({ error: 'Client non trouvé' }, { status: 404 });
    }
    
    const customer = customers[0];
    
    // Préparer le message
    const statusInfo = statusMessages[status];
    if (!statusInfo) {
      return Response.json({ error: 'Statut invalide' }, { status: 400 });
    }
    
    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
          <h1 style="color: #e5b350; margin: 0;">Atelier Art Royal</h1>
          <p style="color: #ffffff; margin: 5px 0;">Haute Couture Maçonnique</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Bonjour ${customer.full_name || 'Client'},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ${statusInfo.message}
          </p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Commande N°:</strong> ${order.order_number}</p>
            <p style="margin: 5px 0;"><strong>Statut:</strong> <span style="color: #e5b350;">${statusInfo.subject}</span></p>
            ${trackingNumber ? `<p style="margin: 5px 0;"><strong>N° de suivi:</strong> ${trackingNumber}</p>` : ''}
          </div>
          
          ${status === 'shipped' && trackingNumber ? `
            <p style="font-size: 14px; color: #666;">
              Vous pouvez suivre votre colis avec le numéro de suivi fourni ci-dessus.
            </p>
          ` : ''}
          
          <p style="margin-top: 30px;">
            Cordialement,<br>
            <strong style="color: #e5b350;">L'équipe Atelier Art Royal</strong>
          </p>
        </div>
        
        <div style="background: #1a1a1a; padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>Atelier Art Royal - Haute Couture Maçonnique</p>
          <p>contact@artroyal.fr | +33 6 46 68 36 10</p>
        </div>
      </div>
    `;
    
    // Envoyer l'email
    await base44.integrations.Core.SendEmail({
      to: customer.email,
      subject: `${statusInfo.subject} - Commande ${order.order_number}`,
      body: emailBody
    });
    
    return Response.json({ 
      success: true,
      message: 'Notification envoyée'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});