import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Vérifier que l'utilisateur est admin
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { 
      email, 
      full_name, 
      phone, 
      address,
      customer_source,
      sales_representative,
      lodge_name,
      rite_id,
      obedience_id,
      degree_order_id
    } = await req.json();

    // Validation des données requises
    if (!email || !full_name) {
      return Response.json({ 
        error: 'Email et nom complet sont requis' 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
    
    if (existingUsers.length > 0) {
      // Mettre à jour l'utilisateur existant
      const userId = existingUsers[0].id;
      await base44.asServiceRole.entities.User.update(userId, {
        full_name,
        phone,
        address,
        customer_source: customer_source || 'usine_directe',
        sales_representative,
        lodge_name,
        rite_id,
        obedience_id,
        degree_order_id
      });

      return Response.json({
        success: true,
        userId,
        message: 'Client existant mis à jour'
      });
    } else {
      // Créer un nouvel utilisateur
      // Note: La création directe d'utilisateurs nécessite un workflow d'invitation
      // Pour l'instant, on retourne une erreur avec instructions
      return Response.json({
        error: 'Pour créer un nouveau client backend, veuillez d\'abord l\'inviter via le système d\'invitation, puis mettre à jour ses informations.',
        suggestion: 'Utilisez le bouton "Inviter un utilisateur" dans le panneau d\'administration.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Erreur création client backend:', error);
    return Response.json({ 
      error: error.message || 'Erreur lors de la création du client' 
    }, { status: 500 });
  }
});