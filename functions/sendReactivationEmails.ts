import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Récupérer tous les utilisateurs
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    
    const now = new Date();
    const inactiveUsers = [];
    
    // Vérifier chaque utilisateur
    for (const user of allUsers) {
      if (!user.email || user.role === 'admin') continue;
      
      // Vérifier la dernière commande
      const userOrders = await base44.asServiceRole.entities.Order.filter({
        customer_id: user.id
      }, '-created_date', 1);
      
      if (userOrders.length === 0) {
        // Utilisateur sans commande depuis 30 jours après inscription
        const accountAge = (now - new Date(user.created_date)) / (1000 * 60 * 60 * 24);
        if (accountAge > 30) {
          inactiveUsers.push({ user, daysSinceSignup: accountAge });
        }
      } else {
        const lastOrderDate = new Date(userOrders[0].created_date);
        const daysSinceLastOrder = (now - lastOrderDate) / (1000 * 60 * 60 * 24);
        
        // Inactif depuis 60 jours
        if (daysSinceLastOrder > 60) {
          // Vérifier qu'aucun email n'a été envoyé récemment
          const recentCampaigns = await base44.asServiceRole.entities.MarketingCampaign.filter({
            user_id: user.id,
            campaign_type: 'reactivation',
            created_date: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString() }
          });
          
          if (recentCampaigns.length === 0) {
            inactiveUsers.push({ user, daysSinceLastOrder });
          }
        }
      }
    }
    
    // Envoyer les emails de réactivation
    const emailsSent = [];
    for (const { user, daysSinceLastOrder } of inactiveUsers) {
      // Récupérer les produits populaires ou nouveaux
      const featuredProducts = await base44.asServiceRole.entities.Product.filter({
        is_active: true,
        featured: true
      }, '-created_date', 3);
      
      let productsHTML = '';
      featuredProducts.forEach(product => {
        const image = product.images?.[0] || '';
        productsHTML += `
          <div style="display: inline-block; width: 30%; margin: 10px; text-align: center;">
            <img src="${image}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
            <h4 style="margin: 10px 0 5px;">${product.name}</h4>
            <p style="color: #e5b350; font-weight: bold;">${product.price.toFixed(2)}€</p>
          </div>
        `;
      });
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ça fait longtemps ! 👋</h2>
          <p>Bonjour ${user.full_name},</p>
          <p>Nous avons remarqué que vous ne nous avez pas rendu visite depuis un moment.</p>
          <p>Nous avons de nouveaux produits exceptionnels qui pourraient vous intéresser :</p>
          <div style="text-align: center; margin: 20px 0;">
            ${productsHTML}
          </div>
          <p><strong>Offre spéciale pour votre retour : 15% de réduction</strong> avec le code : <code style="background: #f0f0f0; padding: 5px 10px;">RETOUR15</code></p>
          <a href="${Deno.env.get('APP_URL') || 'https://votre-site.com'}/catalog" style="display: inline-block; background: #e5b350; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Découvrir les nouveautés
          </a>
          <p style="color: #666; font-size: 12px;">Cette offre est valable 7 jours.</p>
        </div>
      `;
      
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: '✨ De retour parmi nous ? Voici 15% de réduction !',
        body: emailContent
      });
      
      await base44.asServiceRole.entities.MarketingCampaign.create({
        user_id: user.id,
        campaign_type: 'reactivation',
        status: 'sent',
        email_subject: '✨ De retour parmi nous ? Voici 15% de réduction !',
        email_content: emailContent,
        sent_date: new Date().toISOString()
      });
      
      emailsSent.push(user.email);
    }
    
    return Response.json({
      success: true,
      inactiveUsersFound: inactiveUsers.length,
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