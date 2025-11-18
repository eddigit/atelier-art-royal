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
    const csvText = await csvResponse.text();

    // Parse CSV manually (simple parsing)
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const results = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Get existing rites and grades
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

    // Process each product line
    for (let i = 1; i < Math.min(lines.length, 500); i++) {
      try {
        // Simple CSV parsing (handles quoted fields)
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let char of lines[i]) {
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

        // Map columns using field_mapping or fallback to auto-detection
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
          // Fallback to auto-detection
          const index = headers.findIndex(h => h.toLowerCase().includes(targetField.toLowerCase()));
          return index >= 0 ? values[index]?.replace(/^"|"$/g, '').trim() : '';
        };

        const sku = getColumn('sku');
        const name = getColumn('name');
        const priceStr = getColumn('price');
        const categoriesStr = getColumn('category_id');
        const tagsStr = getColumn('tags');
        const imagesStr = getColumn('images');
        const stockStr = getColumn('stock_quantity');
        const shortDesc = getColumn('short_description');
        const desc = getColumn('description');
        const riteHint = getColumn('rite_hint');
        const gradeHint = getColumn('grade_hint');

        if (!name || !priceStr) {
          results.skipped++;
          continue;
        }

        const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (isNaN(price)) {
          results.errors.push(`Ligne ${i}: Prix invalide pour "${name}"`);
          results.skipped++;
          continue;
        }

        // Parse images
        const images = imagesStr 
          ? imagesStr.split(',').map(img => img.trim()).filter(img => img.startsWith('http'))
          : [];

        // Parse tags
        const tags = tagsStr 
          ? tagsStr.split(',').map(t => t.trim()).filter(t => t)
          : [];

        // Extract sizes from tags or metadata
        const sizes = tags.filter(t => 
          ['S', 'M', 'L', 'XL', 'XXL', 'Unique'].some(size => t.includes(size))
        );

        // Try to match category
        let category_id = null;
        if (categoriesStr) {
          const catName = categoriesStr.split('>').pop().trim();
          const matchedCat = categories.find(c => 
            c.name.toLowerCase() === catName.toLowerCase()
          );
          if (matchedCat) category_id = matchedCat.id;
        }

        // Try to match rite from tags or hint
        let rite_id = defaultRite.id;
        const riteSource = riteHint || tagsStr;
        const riteKeywords = ['REAA', 'RER', 'RF', 'GLDF', 'GODF', 'GLNF'];
        for (const keyword of riteKeywords) {
          if (riteSource.toUpperCase().includes(keyword)) {
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

        // Try to match grade from tags or hint
        let grade_id = defaultGrade.id;
        const gradeSource = gradeHint || tagsStr;
        const degreeMatch = gradeSource.match(/(\d+)(er|ème|eme)\s*(degré|ordre|degree)/i);
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
          images: images.length > 0 ? images : undefined,
          tags: tags.length > 0 ? tags : undefined,
          sizes: sizes.length > 0 ? sizes : undefined,
          stock_quantity: stockStr ? parseInt(stockStr) : 0,
          short_description: shortDesc && !shortDesc.includes('Lorem') ? shortDesc : undefined,
          description: desc && !desc.includes('Lorem') ? desc : undefined,
          is_active: true
        };

        // Check if product exists by SKU
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

      } catch (error) {
        results.errors.push(`Ligne ${i}: ${error.message}`);
        if (results.errors.length > 50) break; // Limit errors
      }
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    return Response.json(results);

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});