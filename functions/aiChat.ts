import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    console.log('Request body:', body);
    const { messages, user_context } = body;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages invalides');
    }

    // Fetch AI configuration
    const aiConfigs = await base44.asServiceRole.entities.AIConfig.filter({ is_active: true });
    const systemInstructions = aiConfigs.find(c => c.config_key === 'system_instructions')?.config_value || '';
    const knowledgeBase = aiConfigs.find(c => c.config_key === 'knowledge_base')?.config_value || '';

    // Fetch products with stock information
    const products = await base44.asServiceRole.entities.Product.filter({ is_active: true }, '-created_date', 200);
    
    // Fetch rites, obediences, degreeOrders, categories
    const rites = await base44.asServiceRole.entities.Rite.list('order', 50);
    const obediences = await base44.asServiceRole.entities.Obedience.list('order', 100);
    const degreeOrders = await base44.asServiceRole.entities.DegreeOrder.list('level', 200);
    const categories = await base44.asServiceRole.entities.Category.list('order', 50);

    // Build context for AI
    const productsContext = products.map(p => {
      // Normaliser les IDs (supporter anciens et nouveaux formats)
      const riteIds = Array.isArray(p.rite_ids) && p.rite_ids.length > 0
        ? p.rite_ids 
        : (p.rite_id ? [p.rite_id] : []);
      
      const obedienceIds = Array.isArray(p.obedience_ids) && p.obedience_ids.length > 0
        ? p.obedience_ids 
        : (p.obedience_id ? [p.obedience_id] : []);
      
      const degreeIds = Array.isArray(p.degree_order_ids) && p.degree_order_ids.length > 0
        ? p.degree_order_ids 
        : (p.degree_order_id ? [p.degree_order_id] : []);
      
      const categoryIds = Array.isArray(p.category_ids) && p.category_ids.length > 0
        ? p.category_ids 
        : (p.category_id ? [p.category_id] : []);
      
      // Récupérer les noms
      const productRites = rites.filter(r => riteIds.includes(r.id)).map(r => r.name);
      const productObediences = obediences.filter(o => obedienceIds.includes(o.id)).map(o => o.name);
      const productDegrees = degreeOrders.filter(d => degreeIds.includes(d.id));
      const productCategories = categories.filter(c => categoryIds.includes(c.id)).map(c => c.name);
      
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock_quantity || 0,
        in_stock: (p.stock_quantity > 0) || p.allow_backorders,
        rites: productRites.length > 0 ? productRites.join(', ') : 'Tous rites',
        obediences: productObediences.length > 0 ? productObediences.join(', ') : 'Toutes obédiences',
        degrees: productDegrees.map(d => d.name).join(', '),
        loge_types: [...new Set(productDegrees.map(d => d.loge_type))].join(', '),
        categories: productCategories.join(', '),
        description: p.short_description || p.description?.substring(0, 200)
      };
    });

    // Get authenticated user info if available
    let currentUser = null;
    try {
      currentUser = await base44.auth.me();
    } catch {
      // User not authenticated
    }

    // Build system message
    const systemMessage = `Tu es l'assistant commercial virtuel de l'Atelier Art Royal, spécialisé dans la haute couture maçonnique française.

    ${currentUser ? `CLIENT CONNECTÉ: ${currentUser.full_name} (${currentUser.email})` : 'VISITEUR NON CONNECTÉ'}

    ${systemInstructions}

    BASE DE CONNAISSANCES:
    ${knowledgeBase}

    COMPRENDRE LA HIÉRARCHIE DES PRODUITS:
    La navigation des produits maçonniques suit une hiérarchie précise:
    1. RITE (ex: REAA, RER, GLDF) - Le système rituel pratiqué
    2. OBÉDIENCE (ex: GLNF, GODF, GLAMF) - L'organisation maçonnique (optionnel)
    3. TYPE DE LOGE:
    - Loge Symbolique: Degrés 1-3 (Apprenti, Compagnon, Maître)
    - Loge Hauts Grades: Degrés 4+ et Ordres supérieurs
    4. DEGRÉ & ORDRE - Le niveau hiérarchique spécifique
    5. CATÉGORIE - Type de produit (Tablier, Sautoir, Bijou, Gant, Décor)

    CATALOGUE DISPONIBLE:
    ${JSON.stringify(productsContext, null, 2)}

    RITES DISPONIBLES:
    ${rites.map(r => `- ${r.name} (${r.code}): ${r.description || ''}`).join('\n')}

    OBÉDIENCES DISPONIBLES:
    ${obediences.map(o => `- ${o.name} (${o.code}): ${o.description || ''}`).join('\n')}

    DEGRÉS & ORDRES DISPONIBLES:
    Loges Symboliques:
    ${degreeOrders.filter(d => d.loge_type === 'Loge Symbolique').map(d => `- ${d.name} (niveau ${d.level})`).join('\n')}
    Loges Hauts Grades:
    ${degreeOrders.filter(d => d.loge_type === 'Loge Hauts Grades').map(d => `- ${d.name} (niveau ${d.level})`).join('\n')}

    CATÉGORIES:
    ${categories.map(c => `- ${c.name}`).join('\n')}

    INSTRUCTIONS CRITIQUES POUR L'ACCOMPAGNEMENT CLIENT:

    1. POSER LES BONNES QUESTIONS:
    - Si le client demande quelque chose de vague, pose des questions précises
    - "Quel rite pratiquez-vous?" 
    - "Quel est votre degré actuel?"
    - "Recherchez-vous pour une Loge Symbolique ou Hauts Grades?"
    - "Quel type d'article vous intéresse? (Tablier, Sautoir, Bijou, etc.)"

    2. GESTION INTELLIGENTE DES STOCKS:
    - Si stock > 0: "Ce produit est disponible immédiatement en stock"
    - Si stock = 0 ET allow_backorders = true: "Ce produit peut être commandé, nous le fabriquerons spécialement pour vous dans notre atelier"
    - Si stock = 0: "Ce produit n'est pas en stock actuellement, MAIS nous pouvons le fabriquer sur mesure dans notre atelier de brodage et de fabrication. Nous recevons également de nouveaux stocks chaque jour et notre atelier met à jour nos réalisations chaque soir."

    3. ENGAGEMENT ET RÉASSURANCE:
    - Mentionne toujours: "Nous recevons de nouveaux stocks quotidiennement"
    - Rappelle: "Notre atelier de brodage et fabrication met à jour nos réalisations chaque soir"
    - Rassure sur le savoir-faire artisanal français et la qualité Made in France
    - Utilise un ton élégant, chaleureux et professionnel

    4. CAPTURER LES OPPORTUNITÉS:
    - Si le client montre un intérêt fort pour un produit spécifique, note mentalement son besoin
    - Si demande de personnalisation ou fabrication spéciale, propose de prendre ses coordonnées
    - Si demande à être recontacté, collecte les informations: nom, email, téléphone, détails de la demande

    5. RECOMMANDATIONS PERSONNALISÉES:
    - Propose des produits correspondant EXACTEMENT aux critères du client
    - Fournis l'ID du produit pour créer un lien
    - Suggère des alternatives si nécessaire
    
    6. RECOMMANDATION DE PRODUITS:
    - Quand un client cherche un type de produit (ex: "tablier apprenti"), recommande directement 2-3 produits spécifiques du catalogue
    - Utilise le format: "Voici nos tabliers pour Apprenti disponibles: [PRODUCT:product_id_1] [PRODUCT:product_id_2]"
    - NE génère PAS de liens de filtres, recommande toujours des produits spécifiques avec leurs IDs exacts
    - Si plusieurs produits correspondent, choisis les plus pertinents (en stock en priorité, puis meilleur prix)
    - Explique brièvement pourquoi tu recommandes ces produits

    Réponds en français avec un ton professionnel, chaleureux et respectueux de la tradition maçonnique.`;

    // Check API key
    const apiKey = Deno.env.get('GROQ_API_KEY');
    console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY non configurée');
    }

    // Call Groq API
    console.log('Calling Groq API...');
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log('Groq response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API error (${groqResponse.status}): ${error}`);
    }

    const groqData = await groqResponse.json();
    const aiMessage = groqData.choices[0].message.content;

    // Extract product IDs mentioned (multiple patterns)
    const mentionedProducts = [];
    
    // Pattern 1: [PRODUCT:id]
    const productPattern1 = /\[PRODUCT:([a-f0-9]+)\]/gi;
    let match1;
    while ((match1 = productPattern1.exec(aiMessage)) !== null) {
      const productId = match1[1];
      const product = products.find(p => p.id === productId);
      if (product) {
        mentionedProducts.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]
        });
      }
    }
    
    // Pattern 2: product_id: xxx (fallback)
    if (mentionedProducts.length === 0) {
      const productPattern2 = /product[_-]?id[:\s]+([a-f0-9-]+)/gi;
      let match2;
      while ((match2 = productPattern2.exec(aiMessage)) !== null) {
        const productId = match2[1];
        const product = products.find(p => p.id === productId);
        if (product) {
          mentionedProducts.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]
          });
        }
      }
    }

    // Check if AI suggests creating a lead (keywords detection)
    const leadKeywords = ['recontacter', 'rappeler', 'contact', 'devis', 'fabrication spéciale', 'personnalisation', 'urgence'];
    const shouldCreateLead = leadKeywords.some(keyword => 
      messages[messages.length - 1]?.content?.toLowerCase().includes(keyword)
    );

    let leadCreated = false;

    // Auto-create lead if user shows strong interest
    if (shouldCreateLead && currentUser) {
      try {
        // Analyze priority from conversation
        const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
        let priority = 'normale';

        if (conversationText.includes('urgent') || conversationText.includes('rapidement') || conversationText.includes('immédiat')) {
          priority = 'urgente';
        } else if (conversationText.includes('bientôt') || conversationText.includes('prochain') || conversationText.includes('important')) {
          priority = 'haute';
        }

        const leadData = {
          user_id: currentUser.id,
          contact_name: currentUser.full_name,
          contact_email: currentUser.email,
          request_details: messages[messages.length - 1].content,
          priority: priority,
          conversation_context: JSON.stringify(messages.slice(-5), null, 2),
          source: 'chat_ia'
        };

        const newLead = await base44.asServiceRole.entities.LeadRequest.create(leadData);

        // Send notification email
        await base44.asServiceRole.functions.invoke('notifyLeadCreated', {
          leadId: newLead.id
        });

        leadCreated = true;
      } catch (error) {
        console.error('Failed to create lead:', error);
      }
    }

    return Response.json({
      message: aiMessage,
      suggested_products: mentionedProducts,
      lead_created: leadCreated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack,
      message: "Désolé, je rencontre un problème technique. Veuillez réessayer."
    }, { status: 500 });
  }
});