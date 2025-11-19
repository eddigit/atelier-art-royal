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
      const rite = rites.find(r => r.id === p.rite_id);
      const obedience = obediences.find(o => o.id === p.obedience_id);
      const degreeOrder = degreeOrders.find(d => d.id === p.degree_order_id);
      const category = categories.find(c => c.id === p.category_id);
      
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock_quantity || 0,
        in_stock: (p.stock_quantity > 0) || p.allow_backorders,
        rite: rite?.name,
        obedience: obedience?.name,
        degree_order: degreeOrder?.name,
        loge_type: degreeOrder?.loge_type,
        category: category?.name,
        description: p.short_description || p.description?.substring(0, 200)
      };
    });

    // Build system message
    const systemMessage = `Tu es l'assistant virtuel de l'Atelier Art Royal, spécialisé dans la haute couture maçonnique française.

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

INSTRUCTIONS CRITIQUES:
- TOUJOURS comprendre la hiérarchie: Rite → Obédience → Type de Loge → Degré
- Quand un utilisateur demande un produit, identifie TOUS les critères pertinents
- Guide les utilisateurs qui ne connaissent pas tous leurs critères
- Exemple: "Pour vous aider, pouvez-vous me dire quel rite vous pratiquez? Et quel est votre degré?"
- Propose des produits uniquement correspondant aux critères de l'utilisateur
- Indique toujours le stock disponible
- Si un produit est en rupture mais autorise les pré-commandes, mentionne-le
- Utilise un ton élégant et respectueux de la tradition maçonnique
- Réponds en français

Lorsque tu recommandes un produit, fournis son ID exact pour créer un lien.`;

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
        model: 'llama-3.1-70b-versatile',
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

    // Extract product IDs mentioned (simple regex)
    const productIdPattern = /product[_-]?id[:\s]+([a-f0-9-]+)/gi;
    const mentionedProducts = [];
    let match;
    while ((match = productIdPattern.exec(aiMessage)) !== null) {
      const productId = match[1];
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

    return Response.json({
      message: aiMessage,
      suggested_products: mentionedProducts,
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