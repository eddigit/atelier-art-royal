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

    // Parse CSV manually (simple parsing)
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Le fichier CSV est vide' 
      }, { status: 400 });
    }
    
    // Parse headers with better handling
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

    // Process each product line in batches
    const BATCH_SIZE = 20; // Process 20 products at a time
    const totalLines = lines.length - 1;
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];
        if (!line || line.trim().length === 0) {
          results.skipped++;
          continue;
        }
        
        // Simple CSV parsing (handles quoted fields)
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
        
        // Skip if not enough columns
        if (values.length < 3) {
          results.skipped++;
          continue;
        }

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

        const productId = getColumn('product_id');
        const sku = getColumn('sku');
        const name = getColumn('name');
        const priceStr = getColumn('price');
        const compareAtPriceStr = getColumn('compare_at_price');
        const productType = getColumn('product_type');
        const categoriesStr = getColumn('category_id');
        const tagsStr = getColumn('tags');
        const imagesStr = getColumn('images');
        const sizesStr = getColumn('sizes');
        const stockStr = getColumn('stock_quantity');
        const lowStockStr = getColumn('low_stock_threshold');
        const shortDesc = getColumn('short_description');
        const desc = getColumn('description');
        const riteHint = getColumn('rite_hint');
        const gradeHint = getColumn('grade_hint');
        const isActiveStr = getColumn('is_active');
        const featuredStr = getColumn('featured');
        const promoStartDate = getColumn('promo_start_date');
        const promoEndDate = getColumn('promo_end_date');
        const allowBackordersStr = getColumn('allow_backorders');
        const soldIndividuallyStr = getColumn('sold_individually');
        const weightStr = getColumn('weight');
        const lengthStr = getColumn('length');
        const widthStr = getColumn('width');
        const heightStr = getColumn('height');
        const taxStatus = getColumn('tax_status');
        const taxClass = getColumn('tax_class');
        const shippingClass = getColumn('shipping_class');
        const enableReviewsStr = getColumn('enable_reviews');
        const customerNote = getColumn('customer_note');
        const productGroupsStr = getColumn('product_groups');
        const relatedProductsStr = getColumn('related_products');
        const crossSellStr = getColumn('cross_sell_products');

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
          results.errors.push(`Ligne ${i}: Prix invalide "${priceStr}" pour "${name}"`);
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

        // Parse sizes
        const sizes = sizesStr
          ? sizesStr.split(',').map(s => s.trim()).filter(s => s)
          : [];

        // Parse product groups
        const productGroups = productGroupsStr
          ? productGroupsStr.split(',').map(g => g.trim()).filter(g => g)
          : [];

        // Parse related products
        const relatedProducts = relatedProductsStr
          ? relatedProductsStr.split(',').map(r => r.trim()).filter(r => r)
          : [];

        // Parse cross-sell products
        const crossSellProducts = crossSellStr
          ? crossSellStr.split(',').map(c => c.trim()).filter(c => c)
          : [];

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
          compare_at_price: compareAtPriceStr ? parseFloat(compareAtPriceStr.replace(/[^0-9.]/g, '')) : undefined,
          sku: sku || undefined,
          product_type: productType || undefined,
          rite_id,
          grade_id,
          category_id,
          images: images.length > 0 ? images : undefined,
          tags: tags.length > 0 ? tags : undefined,
          sizes: sizes.length > 0 ? sizes : undefined,
          stock_quantity: stockStr ? parseInt(stockStr) : 0,
          low_stock_threshold: lowStockStr ? parseInt(lowStockStr) : undefined,
          short_description: shortDesc && !shortDesc.includes('Lorem') ? shortDesc : undefined,
          description: desc && !desc.includes('Lorem') ? desc : undefined,
          is_active: isActiveStr === '1' || isActiveStr === 'true' || isActiveStr === 'yes',
          featured: featuredStr === '1' || featuredStr === 'true' || featuredStr === 'yes',
          promo_start_date: promoStartDate || undefined,
          promo_end_date: promoEndDate || undefined,
          allow_backorders: allowBackordersStr === '1' || allowBackordersStr === 'true',
          sold_individually: soldIndividuallyStr === '1' || soldIndividuallyStr === 'true',
          weight: weightStr ? parseFloat(weightStr) : undefined,
          length: lengthStr ? parseFloat(lengthStr) : undefined,
          width: widthStr ? parseFloat(widthStr) : undefined,
          height: heightStr ? parseFloat(heightStr) : undefined,
          tax_status: taxStatus || undefined,
          tax_class: taxClass || undefined,
          shipping_class: shippingClass || undefined,
          enable_reviews: enableReviewsStr === '1' || enableReviewsStr === 'true' || enableReviewsStr !== '0',
          customer_note: customerNote || undefined,
          product_groups: productGroups.length > 0 ? productGroups : undefined,
          related_products: relatedProducts.length > 0 ? relatedProducts : undefined,
          cross_sell_products: crossSellProducts.length > 0 ? crossSellProducts : undefined
        };

        // Check if product exists by ID or SKU
        let existingProduct = null;
        
        if (productId) {
          try {
            const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 1000);
            existingProduct = allProducts.find(p => p.id === productId);
          } catch (e) {
            // Product ID not found
          }
        }
        
        if (!existingProduct && sku) {
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

        // Wait every BATCH_SIZE products to avoid timeouts
        if (i % BATCH_SIZE === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        const errorMsg = `Ligne ${i}: ${error.message}`;
        results.errors.push(errorMsg);
        results.skipped++;
        console.error(errorMsg);
      }
    }

    results.success = results.errors.length === 0 || results.imported > 0;
    results.total_processed = results.imported + results.updated + results.skipped;

    return Response.json(results);

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      details: error.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
});