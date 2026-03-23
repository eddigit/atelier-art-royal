import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      throw new Error('Lead ID manquant');
    }

    // Fetch lead details
    const leads = await base44.asServiceRole.entities.LeadRequest.filter({ id: leadId });
    if (leads.length === 0) {
      throw new Error('Lead non trouvé');
    }

    const lead = leads[0];

    // Fetch user info if available
    let userInfo = 'Visiteur non connecté';
    if (lead.user_id) {
      const users = await base44.asServiceRole.entities.User.filter({ id: lead.user_id });
      if (users.length > 0) {
        userInfo = `${users[0].full_name} (${users[0].email})`;
      }
    }

    // Fetch product info if available
    let productInfo = 'Aucun produit spécifique';
    if (lead.product_id) {
      const products = await base44.asServiceRole.entities.Product.filter({ id: lead.product_id });
      if (products.length > 0) {
        productInfo = products[0].name;
      }
    }

    // Build email content
    const emailBody = `
      <h2>🔔 Nouvelle Demande de Prospect</h2>
      
      <h3>Informations du Client:</h3>
      <ul>
        <li><strong>Utilisateur:</strong> ${userInfo}</li>
        <li><strong>Nom:</strong> ${lead.contact_name || 'Non fourni'}</li>
        <li><strong>Email:</strong> ${lead.contact_email || 'Non fourni'}</li>
        <li><strong>Téléphone:</strong> ${lead.contact_phone || 'Non fourni'}</li>
      </ul>

      <h3>Détails de la Demande:</h3>
      <p><strong>Priorité:</strong> <span style="color: ${
        lead.priority === 'urgente' ? '#dc2626' : 
        lead.priority === 'haute' ? '#ea580c' : 
        lead.priority === 'normale' ? '#0ea5e9' : '#64748b'
      }; font-weight: bold; text-transform: uppercase;">${lead.priority}</span></p>
      <p><strong>Détails:</strong></p>
      <blockquote style="background: #f1f5f9; padding: 15px; border-left: 4px solid #e5b350;">
        ${lead.request_details}
      </blockquote>

      ${lead.rite ? `<p><strong>Rite:</strong> ${lead.rite}</p>` : ''}
      ${lead.obedience ? `<p><strong>Obédience:</strong> ${lead.obedience}</p>` : ''}
      ${lead.degree_order ? `<p><strong>Degré & Ordre:</strong> ${lead.degree_order}</p>` : ''}
      ${productInfo !== 'Aucun produit spécifique' ? `<p><strong>Produit d'intérêt:</strong> ${productInfo}</p>` : ''}

      ${lead.conversation_context ? `
        <h3>Contexte de la Conversation:</h3>
        <pre style="background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 12px; white-space: pre-wrap;">${lead.conversation_context}</pre>
      ` : ''}

      <p style="margin-top: 20px;">
        <strong>Source:</strong> ${lead.source}<br>
        <strong>Date:</strong> ${new Date(lead.created_date).toLocaleString('fr-FR')}
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px;">
        Connectez-vous à votre tableau de bord administrateur pour gérer cette demande.
      </p>
    `;

    // Send to fixed emails
    const emailRecipients = ['contact@artroyal.fr', 'coachdigitalparis@gmail.com'];
    
    for (const recipient of emailRecipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Atelier Art Royal - Notifications',
        to: recipient,
        subject: `🔔 Nouvelle Demande ${lead.priority === 'urgente' || lead.priority === 'haute' ? '🔥 PRIORITAIRE' : ''} - ${lead.contact_name || 'Prospect'}`,
        body: emailBody
      });
    }

    return Response.json({
      success: true,
      message: `Notifications envoyées à ${emailRecipients.length} destinataire(s)`
    });

  } catch (error) {
    console.error('Error notifying lead:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});