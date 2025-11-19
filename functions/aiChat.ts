import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { messages, user_context } = await req.json();

    // Fetch AI configuration
    const aiConfigs = await base44.asServiceRole.entities.AIConfig.filter({ is_active: true });
    const systemInstructions = aiConfigs.find(c => c.config_key === 'system_instructions')?.config_value || '';
    const knowledgeBase = aiConfigs.find(c => c.config_key === 'knowledge_base')?.config_value || '';

    // Fetch products with stock information
    const products = await base44.asServiceRole.entities.Product.filter({ is_active: true }, '-created_date', 200);
    
    // Fetch rites, grades, categories
    const rites = await base44.asServiceRole.entities.Rite.list('order', 50);
    const grades = await base44.asServiceRole.entities.Grade.list('level', 100);
    const categories = await base44.asServiceRole.entities.Category.list('order', 50);

    // Build context for AI
    const productsContext = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock_quantity || 0,
      in_stock: (p.stock_quantity > 0) || p.allow_backorders,
      rite: rites.find(r => r.id === p.rite_id)?.name,
      grade: grades.find(g => g.id === p.grade_id)?.name,
      category: categories.find(c => c.id === p.category_id)?.name,
      description: p.short_description || p.description?.substring(0, 200)
    }));

    // Build system message
    const systemMessage = `Tu es l'assistant virtuel de l'Atelier Art Royal, spécialisé dans la haute couture maçonnique française.

${systemInstructions}

BASE DE CONNAISSANCES:
${knowledgeBase}

CATALOGUE DISPONIBLE:
${JSON.stringify(productsContext, null, 2)}

RITES DISPONIBLES:
${rites.map(r => `- ${r.name} (${r.code})`).join('\n')}

GRADES DISPONIBLES:
${grades.map(g => `- ${g.name} (niveau ${g.level})`).join('\n')}

CATÉGORIES:
${categories.map(c => `- ${c.name}`).join('\n')}

INSTRUCTIONS:
- Sois professionnel, courtois et précis
- Utilise les informations du catalogue pour répondre
- Indique toujours le stock disponible
- Si un produit est en rupture mais autorise les pré-commandes, mentionne-le
- Propose des produits pertinents selon la demande
- Guide l'utilisateur vers les pages appropriées
- Utilise un ton élégant et respectueux de la tradition maçonnique
- Réponds en français

Lorsque tu recommandes un produit, fournis son ID pour créer un lien.`;

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`
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

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      throw new Error(`Groq API error: ${error}`);
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
    return Response.json({ 
      error: error.message,
      message: "Désolé, je rencontre un problème technique. Veuillez réessayer."
    }, { status: 500 });
  }
});