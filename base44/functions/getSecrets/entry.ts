import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Vérifier que l'utilisateur est admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Récupérer les secrets depuis les variables d'environnement
    const secrets = {
      SUMUP_API_KEY: Deno.env.get('SUMUP_API_KEY') || 'Non configuré',
      GROQ_API_KEY: Deno.env.get('GROQ_API_KEY') || 'Non configuré'
    };

    return Response.json({ secrets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});