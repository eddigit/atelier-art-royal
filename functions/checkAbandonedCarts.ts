import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Récupérer tous les paniers
    const allCartItems = await base44.asServiceRole.entities.CartItem.list('-created_date', 1000);
    
    // Grouper par utilisateur
    const cartsByUser = {};
    allCartItems.forEach(item => {
      if (!cartsByUser[item.user_id]) {
        cartsByUser[item.user_id] = [];
      }
      cartsByUser[item.user_id].push(item);
    });
    
    const now = new Date();
    const abandonedCarts = [];
    
    // Vérifier chaque panier
    for (const [userId, items] of Object.entries(cartsByUser)) {
      if (items.length === 0) continue;
      
      // Vérifier la dernière activité
      const lastItemDate = new Date(items[0].created_date);
      const hoursSinceLastActivity = (now - lastItemDate) / (1000 * 60 * 60);
      
      // Si panier abandonné depuis plus de 24h
      if (hoursSinceLastActivity > 24) {
        // Vérifier qu'aucune commande n'a été passée
        const userOrders = await base44.asServiceRole.entities.Order.filter({
          customer_id: userId,
          created_date: { $gte: lastItemDate.toISOString() }
        });
        
        if (userOrders.length === 0) {
          // Vérifier qu'aucun email n'a déjà été envoyé récemment
          const recentCampaigns = await base44.asServiceRole.entities.MarketingCampaign.filter({
            user_id: userId,
            campaign_type: 'abandoned_cart',
            created_date: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() }
          });
          
          if (recentCampaigns.length === 0) {
            abandonedCarts.push({ userId, items });
          }
        }
      }
    }
    
    // Envoyer les emails de relance
    const emailsSent = [];
    for (const cart of abandonedCarts) {
      const user = await base44.asServiceRole.entities.User.filter({ id: cart.userId });
      if (user.length === 0 || !user[0].email) continue;
      
      // Récupérer les produits
      const productIds = cart.items.map(item => item.product_id);
      const products = await base44.asServiceRole.entities.Product.filter({
        id: { $in: productIds }
      });
      
      // Construire l'email
      let productsList = '';
      let totalAmount = 0;
      cart.items.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          productsList += `<li>${product.name} - ${item.quantity}x ${product.price.toFixed(2)}€</li>`;
          totalAmount += product.price * item.quantity;
        }
      });
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Vous avez oublié quelque chose ! 🛒</h2>
          <p>Bonjour ${user[0].full_name},</p>
          <p>Nous avons remarqué que vous avez laissé des articles dans votre panier :</p>
          <ul style="list-style: none; padding: 0;">
            ${productsList}
          </ul>
          <p><strong>Total : ${totalAmount.toFixed(2)}€</strong></p>
          <p>Profitez de <strong>10% de réduction</strong> avec le code : <code style="background: #f0f0f0; padding: 5px 10px;">RETOUR10</code></p>
          <a href="${Deno.env.get('APP_URL') || 'https://votre-site.com'}/cart" style="display: inline-block; background: #e5b350; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Finaliser ma commande
          </a>
          <p style="color: #666; font-size: 12px;">Cette offre est valable 48h.</p>
        </div>
      `;
      
      // Envoyer l'email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user[0].email,
        subject: '🛒 N\'oubliez pas votre panier !',
        body: emailContent
      });
      
      // Créer la campagne
      await base44.asServiceRole.entities.MarketingCampaign.create({
        user_id: cart.userId,
        campaign_type: 'abandoned_cart',
        status: 'sent',
        email_subject: '🛒 N\'oubliez pas votre panier !',
        email_content: emailContent,
        sent_date: new Date().toISOString(),
        cart_items: cart.items
      });
      
      emailsSent.push(user[0].email);
    }
    
    return Response.json({
      success: true,
      abandonedCartsFound: abandonedCarts.length,
      emailsSent: emailsSent.length,
      emails: emailsSent
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});