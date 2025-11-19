import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, field_mapping } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Fetch CSV file
    const csvResponse = await fetch(file_url);
    if (!csvResponse.ok) {
      return Response.json({ 
        success: false, 
        error: `Impossible de charger le fichier CSV: ${csvResponse.statusText}` 
      }, { status: 400 });
    }
    
    const csvText = await csvResponse.text();

    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Le fichier CSV est vide' 
      }, { status: 400 });
    }
    
    // Parse headers
    const firstLine = lines[0];
    const headers = [];
    let currentHeader = '';
    let inQuotes = false;
    
    for (let char of firstLine) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        headers.push(currentHeader.trim().replace(/^"|"$/g, ''));
        currentHeader = '';
      } else {
        currentHeader += char;
      }
    }
    headers.push(currentHeader.trim().replace(/^"|"$/g, ''));
    
    // Get existing data
    const rites = await base44.asServiceRole.entities.Rite.list('order', 100);
    const grades = await base44.asServiceRole.entities.Grade.list('level', 200);
    const categories = await base44.asServiceRole.entities.Category.list('order', 100);

    // Create default rite/grade if none exist
    let defaultRite = rites[0];
    if (!defaultRite) {
      defaultRite = await base44.asServiceRole.entities.Rite.create({
        name: 'Non spécifié',
        code: 'NS',
        order: 999
      });
    }

    let defaultGrade = grades[0];
    if (!defaultGrade) {
      defaultGrade = await base44.asServiceRole.entities.Grade.create({
        name: 'Non spécifié',
        level: 0,
        rite_id: defaultRite.id
      });
    }

    // Helper function to download and upload image
    const uploadImage = async (imageUrl) => {
      try {
        if (!imageUrl || !imageUrl.startsWith('http')) return null;
        
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) return null;
        
        const blob = await imageResponse.blob();
        const file = new File([blob], 'product-image.jpg', { type: blob.type });
        
        const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        return result.file_url;
      } catch (error) {
        console.error(`Erreur upload image ${imageUrl}:`, error.message);
        return null;
      }
    };

    // Return streaming response for progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const results = {
          success: true,
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: [],
          total: lines.length - 1
        };

        const sendProgress = (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Process each product
        for (let i = 1; i < lines.length; i++) {
          try {
            const line = lines[i];
            if (!line || line.trim().length === 0) {
              results.skipped++;
              continue;
            }
            
            // Parse CSV line
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let char of line) {
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.trim());
            
            if (values.length < 3) {
              results.skipped++;
              continue;
            }

            const getColumn = (targetField) => {
              if (field_mapping) {
                const csvField = Object.keys(field_mapping).find(
                  key => field_mapping[key] === targetField
                );
                if (csvField) {
                  const index = headers.indexOf(csvField);
                  return index >= 0 ? values[index]?.replace(/^"|"$/g, '').trim() : '';
                }
              }
              const index = headers.findIndex(h => h.toLowerCase().includes(targetField.toLowerCase()));
              return index >= 0 ? values[index]?.replace(/^"|"$/g, '').trim() : '';
            };

            const name = getColumn('name');
            const priceStr = getColumn('price');
            const sku = getColumn('sku');
            const imagesStr = getColumn('images');

            if (!name || name.length === 0) {
              results.skipped++;
              continue;
            }

            if (!priceStr || priceStr.length === 0) {
              results.errors.push(`Ligne ${i}: Prix manquant pour "${name}"`);
              results.skipped++;
              continue;
            }

            const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
            if (isNaN(price) || price <= 0) {
              results.errors.push(`Ligne ${i}: Prix invalide pour "${name}"`);
              results.skipped++;
              continue;
            }

            // Download and upload images
            const imageUrls = imagesStr 
              ? imagesStr.split(',').map(img => img.trim()).filter(img => img.startsWith('http'))
              : [];
            
            const uploadedImages = [];
            for (const imageUrl of imageUrls.slice(0, 5)) { // Max 5 images
              const newUrl = await uploadImage(imageUrl);
              if (newUrl) uploadedImages.push(newUrl);
            }

            // Parse other fields
            const tags = getColumn('tags')
              ? getColumn('tags').split(',').map(t => t.trim()).filter(t => t)
              : [];
            
            const sizes = getColumn('sizes')
              ? getColumn('sizes').split(',').map(s => s.trim()).filter(s => s)
              : [];

            // Match category
            let category_id = null;
            const categoriesStr = getColumn('category_id');
            if (categoriesStr) {
              const catName = categoriesStr.split('>').pop().trim();
              const matchedCat = categories.find(c => 
                c.name.toLowerCase() === catName.toLowerCase()
              );
              if (matchedCat) category_id = matchedCat.id;
            }

            // Match rite
            let rite_id = defaultRite.id;
            const riteHint = getColumn('rite_hint') || getColumn('tags');
            const riteKeywords = ['REAA', 'RER', 'RF', 'GLDF', 'GODF', 'GLNF'];
            for (const keyword of riteKeywords) {
              if (riteHint.toUpperCase().includes(keyword)) {
                const matchedRite = rites.find(r => 
                  r.code.toUpperCase().includes(keyword) || 
                  r.name.toUpperCase().includes(keyword)
                );
                if (matchedRite) {
                  rite_id = matchedRite.id;
                  break;
                }
              }
            }

            // Match grade
            let grade_id = defaultGrade.id;
            const gradeHint = getColumn('grade_hint') || getColumn('tags');
            const degreeMatch = gradeHint.match(/(\d+)(er|ème|eme)\s*(degré|ordre|degree)/i);
            if (degreeMatch) {
              const level = parseInt(degreeMatch[1]);
              const matchedGrade = grades.find(g => g.level === level && g.rite_id === rite_id);
              if (matchedGrade) grade_id = matchedGrade.id;
            }

            const productData = {
              name,
              price,
              sku: sku || undefined,
              rite_id,
              grade_id,
              category_id,
              images: uploadedImages.length > 0 ? uploadedImages : undefined,
              tags: tags.length > 0 ? tags : undefined,
              sizes: sizes.length > 0 ? sizes : undefined,
              stock_quantity: parseInt(getColumn('stock_quantity')) || 0,
              short_description: getColumn('short_description') || undefined,
              description: getColumn('description') || undefined,
              is_active: getColumn('is_active') === '1' || getColumn('is_active') === 'true',
              featured: getColumn('featured') === '1' || getColumn('featured') === 'true'
            };

            // Check if product exists
            let existingProduct = null;
            if (sku) {
              const existing = await base44.asServiceRole.entities.Product.filter({ sku });
              existingProduct = existing[0];
            }

            if (existingProduct) {
              await base44.asServiceRole.entities.Product.update(existingProduct.id, productData);
              results.updated++;
            } else {
              await base44.asServiceRole.entities.Product.create(productData);
              results.imported++;
            }

            // Send progress update every product
            sendProgress({
              type: 'progress',
              current: i,
              total: results.total,
              imported: results.imported,
              updated: results.updated,
              skipped: results.skipped,
              productName: name
            });

          } catch (error) {
            const errorMsg = `Ligne ${i}: ${error.message}`;
            results.errors.push(errorMsg);
            results.skipped++;
            console.error(errorMsg);
          }
        }

        // Send final results
        results.success = results.imported > 0 || results.updated > 0;
        results.total_processed = results.imported + results.updated + results.skipped;
        
        sendProgress({
          type: 'complete',
          results
        });

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      details: error.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
});