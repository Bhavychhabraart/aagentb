import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Material tier definitions
const MATERIAL_TIERS = {
  budget: {
    name: 'Budget',
    level: 1,
    multiplier: 0.7,
    description: 'Cost-effective materials maintaining aesthetics'
  },
  standard: {
    name: 'Standard', 
    level: 2,
    multiplier: 1.0,
    description: 'Quality mainstream materials'
  },
  premium: {
    name: 'Premium',
    level: 3,
    multiplier: 1.8,
    description: 'High-end luxury materials'
  }
};

// Default material options by category
const DEFAULT_MATERIALS = {
  wood: {
    budget: { name: 'MDF/Particle Board', rate: 450 },
    standard: { name: 'Plywood/Engineered Wood', rate: 850 },
    premium: { name: 'Solid Hardwood/Teak', rate: 2200 }
  },
  fabric: {
    budget: { name: 'Polyester Blend', rate: 350 },
    standard: { name: 'Cotton/Linen', rate: 750 },
    premium: { name: 'Velvet/Leather', rate: 1800 }
  },
  metal: {
    budget: { name: 'Chrome/Steel', rate: 200 },
    standard: { name: 'Brushed Brass', rate: 450 },
    premium: { name: 'Gold/Rose Gold Finish', rate: 950 }
  },
  stone: {
    budget: { name: 'Engineered Stone', rate: 550 },
    standard: { name: 'Quartz', rate: 1200 },
    premium: { name: 'Italian Marble', rate: 3500 }
  },
  glass: {
    budget: { name: 'Clear Glass', rate: 180 },
    standard: { name: 'Tempered Glass', rate: 350 },
    premium: { name: 'Tinted/Frosted Premium', rate: 650 }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action,
      renderUrl,
      layoutUrl,
      catalogItems,
      stagedItems,
      materialPricing,
      existingProducts
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[generate-quote] Action: ${action}`);

    let result;

    switch (action) {
      case 'analyze_render':
        result = await analyzeRender(renderUrl, catalogItems, LOVABLE_API_KEY);
        break;
      
      case 'generate_variants':
        result = await generateMaterialVariants(existingProducts, materialPricing, LOVABLE_API_KEY);
        break;
      
      case 'create_custom':
        result = await createCustomProducts(renderUrl, LOVABLE_API_KEY);
        break;
      
      case 'full_layout':
        result = await analyzeFullLayout(renderUrl, layoutUrl, catalogItems, LOVABLE_API_KEY);
        break;
      
      case 'match_catalog':
        result = await matchProductsToCatalog(stagedItems, catalogItems, LOVABLE_API_KEY);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-quote] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeRender(
  renderUrl: string, 
  catalogItems: any[], 
  apiKey: string
) {
  console.log('[analyze_render] Analyzing render for furniture detection...');
  
  const catalogSummary = catalogItems?.slice(0, 50).map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price
  })) || [];

  const prompt = `You are an expert interior designer and furniture analyst.

TASK: Analyze this room render image and detect all furniture items visible.

For each detected furniture item:
1. Identify the furniture type (sofa, table, chair, lamp, rug, etc.)
2. Estimate its approximate position in the image (x, y as percentage 0-100)
3. Describe its style, color, and key features
4. Estimate dimensions if possible
5. Suggest a base price range for this item

AVAILABLE CATALOG ITEMS (try to match detected items to these):
${JSON.stringify(catalogSummary, null, 2)}

RESPOND IN THIS EXACT JSON FORMAT:
{
  "detected_items": [
    {
      "label": "Item name/description",
      "category": "furniture category",
      "position_x": 50,
      "position_y": 60,
      "style": "modern/traditional/minimalist/etc",
      "color": "primary color",
      "features": ["feature1", "feature2"],
      "estimated_dimensions": { "width": 180, "depth": 90, "height": 85 },
      "base_price_estimate": 45000,
      "catalog_match_id": "matched catalog item id or null",
      "catalog_match_name": "matched catalog item name or null",
      "match_confidence": 85,
      "materials_detected": ["wood", "fabric", "metal"]
    }
  ],
  "room_analysis": {
    "room_type": "living room/bedroom/etc",
    "style": "detected overall style",
    "color_palette": ["#color1", "#color2"],
    "lighting": "natural/artificial/mixed",
    "total_items_detected": 5
  }
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: renderUrl } }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[analyze_render] API error:', errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[analyze_render] No JSON found in response:', content);
    throw new Error('Failed to parse AI response');
  }

  const analysis = JSON.parse(jsonMatch[0]);
  console.log(`[analyze_render] Detected ${analysis.detected_items?.length || 0} items`);

  return {
    success: true,
    analysis,
    detected_items: analysis.detected_items || [],
    room_analysis: analysis.room_analysis || {}
  };
}

async function generateMaterialVariants(
  products: any[],
  customPricing: any[],
  apiKey: string
) {
  console.log('[generate_variants] Creating material tier variants...');

  const variants: Record<string, { items: any[]; subtotal: number }> = {
    budget: { items: [], subtotal: 0 },
    standard: { items: [], subtotal: 0 },
    premium: { items: [], subtotal: 0 }
  };

  for (const product of products) {
    const basePrice = product.base_price || product.price || 10000;
    const materialsUsed = product.materials_detected || ['wood', 'fabric'];
    
    // Get custom pricing if available, otherwise use defaults
    for (const tier of ['budget', 'standard', 'premium'] as const) {
      const tierMultiplier = MATERIAL_TIERS[tier].multiplier;
      let materialNames: string[] = [];
      let totalUpcharge = 0;

      for (const material of materialsUsed) {
        const customRate = customPricing?.find(
          p => p.material_category === material && p.tier === tier
        );
        
        const materialInfo = customRate || DEFAULT_MATERIALS[material as keyof typeof DEFAULT_MATERIALS]?.[tier];
        if (materialInfo) {
          materialNames.push(materialInfo.name || customRate?.material_name);
          totalUpcharge += (materialInfo.rate || customRate?.base_rate || 0) * 0.1; // 10% of material cost as upcharge
        }
      }

      const finalPrice = Math.round(basePrice * tierMultiplier + totalUpcharge);
      
      variants[tier].items.push({
        ...product,
        material_name: materialNames.join(' + '),
        material_category: materialsUsed[0],
        base_price: basePrice,
        material_upcharge: Math.round(totalUpcharge),
        final_price: finalPrice,
        tier_level: MATERIAL_TIERS[tier].level
      });
      
      variants[tier].subtotal += finalPrice;
    }
  }

  // Calculate totals with commission
  const commissionRate = 0.15; // 15% commission
  
  return {
    success: true,
    versions: [
      {
        version_name: 'Budget',
        tier_level: 1,
        items: variants.budget.items,
        subtotal: variants.budget.subtotal,
        commission: Math.round(variants.budget.subtotal * commissionRate),
        grand_total: Math.round(variants.budget.subtotal * (1 + commissionRate)),
        is_recommended: false
      },
      {
        version_name: 'Standard',
        tier_level: 2,
        items: variants.standard.items,
        subtotal: variants.standard.subtotal,
        commission: Math.round(variants.standard.subtotal * commissionRate),
        grand_total: Math.round(variants.standard.subtotal * (1 + commissionRate)),
        is_recommended: true
      },
      {
        version_name: 'Premium',
        tier_level: 3,
        items: variants.premium.items,
        subtotal: variants.premium.subtotal,
        commission: Math.round(variants.premium.subtotal * commissionRate),
        grand_total: Math.round(variants.premium.subtotal * (1 + commissionRate)),
        is_recommended: false
      }
    ]
  };
}

async function createCustomProducts(
  renderUrl: string,
  apiKey: string
) {
  console.log('[create_custom] Generating custom product designs...');

  const prompt = `You are a custom furniture designer and cost estimator.

TASK: Analyze this room render and create detailed specifications for CUSTOM FURNITURE that matches what you see.

For each major furniture piece visible:
1. Create a custom product specification
2. Detail exact materials needed
3. Provide manufacturing specifications
4. Estimate costs for 3 material tiers (Budget/Standard/Premium)

RESPOND IN THIS EXACT JSON FORMAT:
{
  "custom_products": [
    {
      "name": "Custom Sectional Sofa",
      "category": "Seating",
      "description": "L-shaped sectional with chaise, modern minimalist design",
      "dimensions": {
        "width": 280,
        "depth": 180,
        "height": 85,
        "unit": "cm"
      },
      "materials": {
        "frame": "Kiln-dried hardwood",
        "cushion": "High-density foam",
        "upholstery": "Performance fabric",
        "legs": "Solid oak"
      },
      "manufacturing": {
        "estimated_hours": 40,
        "skill_level": "expert",
        "special_requirements": ["CNC cutting", "upholstery work"]
      },
      "pricing": {
        "budget": { "price": 85000, "materials": "MDF frame, polyester fabric" },
        "standard": { "price": 145000, "materials": "Plywood frame, cotton-linen blend" },
        "premium": { "price": 285000, "materials": "Solid wood frame, Italian leather" }
      },
      "position_x": 30,
      "position_y": 50
    }
  ],
  "total_custom_items": 3,
  "overall_style": "Contemporary Minimalist",
  "color_scheme": "Neutral earth tones with black accents"
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: renderUrl } }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse custom products response');
  }

  const result = JSON.parse(jsonMatch[0]);
  
  return {
    success: true,
    custom_products: result.custom_products || [],
    overall_style: result.overall_style,
    color_scheme: result.color_scheme
  };
}

async function analyzeFullLayout(
  renderUrl: string,
  layoutUrl: string | null,
  catalogItems: any[],
  apiKey: string
) {
  console.log('[full_layout] Performing full layout analysis...');

  // First analyze the render
  const renderAnalysis = await analyzeRender(renderUrl, catalogItems, apiKey);
  
  // Then create custom products for items not in catalog
  const customProducts = await createCustomProducts(renderUrl, apiKey);
  
  // Combine catalog matches and custom products
  const allItems = [
    ...renderAnalysis.detected_items.filter((item: any) => item.catalog_match_id),
    ...customProducts.custom_products
  ];

  // Generate material variants for all items
  const variants = await generateMaterialVariants(
    allItems.map(item => ({
      ...item,
      base_price: item.base_price_estimate || item.pricing?.standard?.price || 20000,
      materials_detected: item.materials_detected || Object.keys(item.materials || { wood: true })
    })),
    [],
    apiKey
  );

  return {
    success: true,
    render_analysis: renderAnalysis.room_analysis,
    catalog_matches: renderAnalysis.detected_items.filter((item: any) => item.catalog_match_id),
    custom_products: customProducts.custom_products,
    versions: variants.versions,
    recommendation: 'Standard tier provides best value with quality materials'
  };
}

async function matchProductsToCatalog(
  stagedItems: any[],
  catalogItems: any[],
  apiKey: string
) {
  console.log('[match_catalog] Matching staged items to catalog...');
  
  const catalogSummary = catalogItems?.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    description: item.description
  })) || [];

  const stagedSummary = stagedItems?.map(item => ({
    name: item.item_name,
    category: item.item_category,
    description: item.item_description,
    image_url: item.item_image_url
  })) || [];

  const prompt = `You are a product matching expert.

TASK: Match these staged furniture items to catalog products.

STAGED ITEMS TO MATCH:
${JSON.stringify(stagedSummary, null, 2)}

AVAILABLE CATALOG:
${JSON.stringify(catalogSummary, null, 2)}

For each staged item, find the best matching catalog item based on:
- Category match
- Style similarity
- Feature alignment

RESPOND IN JSON:
{
  "matches": [
    {
      "staged_item_name": "original name",
      "catalog_item_id": "matched id",
      "catalog_item_name": "matched name",
      "catalog_item_price": 50000,
      "confidence": 85,
      "match_reason": "Similar style and dimensions"
    }
  ]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }]
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse catalog matching response');
  }

  const result = JSON.parse(jsonMatch[0]);
  
  return {
    success: true,
    matches: result.matches || []
  };
}
