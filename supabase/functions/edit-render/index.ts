import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FurnitureItem {
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  position?: { x: number; y: number }; // Percentage position (0-100) for composite mode
  scale?: number; // Scale factor for composite mode
}

// Map furniture categories to replacement instructions
function getCategoryReplacementInstruction(category: string): string {
  const categoryMap: Record<string, string> = {
    'Seating': 'sofa, chair, or seating furniture',
    'Tables': 'table (coffee table, dining table, side table)',
    'Bedroom': 'bed or bedroom furniture',
    'Lighting': 'lamp or lighting fixture',
    'Storage': 'storage unit, cabinet, or shelf',
    'Decoration': 'decorative item',
  };
  return categoryMap[category] || category.toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentRenderUrl, 
      furnitureItems, 
      userPrompt,
      layoutImageUrl,
      styleRefUrls,
      compositeMode = false // New: use precise compositing
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!currentRenderUrl) {
      throw new Error('Current render URL is required for editing');
    }

    console.log('Editing render with furniture items:', furnitureItems?.length || 0);
    console.log('Current render URL:', currentRenderUrl.substring(0, 100) + '...');
    console.log('Layout reference:', layoutImageUrl ? 'provided' : 'none');
    console.log('Style references:', styleRefUrls?.length || 0);
    console.log('Composite mode:', compositeMode);

    // If composite mode is enabled and furniture has position data, use precise compositing
    const furnitureWithPositions = (furnitureItems as FurnitureItem[] || []).filter(
      item => item.imageUrl && item.position && item.scale !== undefined
    );

    if (compositeMode && furnitureWithPositions.length > 0) {
      console.log('Using COMPOSITE MODE for precise furniture placement');
      
      // Build content for precise compositing
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      let imageIndex = 1;

      // IMAGE 1: Base render
      content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
      const baseRenderIndex = imageIndex++;

      // IMAGE 2: Layout reference (if provided)
      let layoutIndex: number | null = null;
      if (layoutImageUrl) {
        content.push({ type: 'image_url', image_url: { url: layoutImageUrl } });
        layoutIndex = imageIndex++;
      }

      // Style references
      const styleIndices: number[] = [];
      if (styleRefUrls && styleRefUrls.length > 0) {
        for (const styleUrl of styleRefUrls) {
          content.push({ type: 'image_url', image_url: { url: styleUrl } });
          styleIndices.push(imageIndex++);
        }
      }

      // Furniture images with placement info
      const furnitureIndices: { name: string; category: string; index: number; position: { x: number; y: number }; scale: number }[] = [];
      for (const item of furnitureWithPositions) {
        content.push({ type: 'image_url', image_url: { url: item.imageUrl! } });
        furnitureIndices.push({
          name: item.name,
          category: item.category,
          index: imageIndex++,
          position: item.position!,
          scale: item.scale!,
        });
      }

      // Build ultra-precise compositing prompt
      let compositingPrompt = `You are performing PRECISE IMAGE COMPOSITING. This is NOT creative generation - you must EXACTLY composite furniture images into the room.

=== CRITICAL COMPOSITING RULES ===

IMAGE ${baseRenderIndex}: BASE ROOM RENDER
- This is the EXACT room to composite furniture into
- Keep the room COMPLETELY UNCHANGED: walls, floors, ceiling, windows, lighting, shadows
- Do NOT modify any part of the room - only ADD furniture to it
- Maintain the EXACT same camera angle, perspective, and lighting

`;

      if (layoutIndex !== null) {
        compositingPrompt += `IMAGE ${layoutIndex}: FLOOR PLAN LAYOUT
- Use this to verify furniture positions match the layout
- Furniture should be placed at positions that correspond to this floor plan

`;
      }

      if (styleIndices.length > 0) {
        compositingPrompt += `IMAGES ${styleIndices.join(', ')}: STYLE REFERENCES
- Match the overall aesthetic and lighting style from these references
- Apply realistic shadows that match the room's lighting direction

`;
      }

      // Add precise furniture placement instructions
      compositingPrompt += `=== FURNITURE COMPOSITING - PIXEL-PERFECT ACCURACY ===

For each furniture item below, you must:
1. EXTRACT the exact product from its reference image
2. SCALE it to the specified size relative to the room
3. POSITION it at the exact specified coordinates
4. BLEND shadows/lighting to match the room's illumination
5. DO NOT MODIFY the product in any way - it must look identical to the reference

`;

      for (const { name, category, index, position, scale } of furnitureIndices) {
        compositingPrompt += `
IMAGE ${index}: "${name}" (${category})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POSITION: ${position.x}% from left, ${position.y}% from top
SCALE: ${Math.round(scale * 100)}% of natural size relative to room

⚠️ ABSOLUTE REQUIREMENTS:
• The product must be PIXEL-IDENTICAL to IMAGE ${index}
• Copy the EXACT shape, color, texture, and all details
• DO NOT regenerate or reinterpret - COPY EXACTLY
• Apply realistic shadows matching room lighting direction
• Perspective should match the room's camera angle

🎯 POSITIONING:
• Place furniture so its base/center is at ${position.x}% horizontal, ${position.y}% vertical
• Scale: ${scale < 1 ? 'Make smaller than natural' : scale > 1 ? 'Make larger than natural' : 'Keep natural size'}
• Ensure realistic proportions relative to room size

`;
      }

      // Add user prompt if provided
      if (userPrompt && userPrompt.trim()) {
        compositingPrompt += `\nAdditional instructions: ${userPrompt}\n`;
      }

      compositingPrompt += `
=== OUTPUT REQUIREMENTS ===

1. The output must be the BASE RENDER (IMAGE ${baseRenderIndex}) with furniture composited in
2. Room must be UNCHANGED - only add furniture
3. Furniture must be PIXEL-PERFECT copies of reference images
4. Maintain 16:9 LANDSCAPE aspect ratio
5. Apply realistic shadows for each placed item
6. Final result should look like a professional furniture staging

⚠️ QUALITY CHECK: 
After compositing, each furniture item will be compared side-by-side with its reference.
ANY deviation in shape, color, or details is a failure.
The goal is 100% visual accuracy - as if the catalog image was cut out and pasted into the room.`;

      content.push({ type: 'text', text: compositingPrompt });

      console.log('Composite prompt length:', compositingPrompt.length);
      console.log('Total images in composite request:', content.filter(c => c.type === 'image_url').length);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-image-preview',
          messages: [{ role: 'user', content }],
          modalities: ['image', 'text'],
          generationConfig: { aspectRatio: "16:9" }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error(`AI gateway error: ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        console.error('No image in response:', JSON.stringify(data).substring(0, 500));
        throw new Error('No image generated from composite request');
      }

      console.log('Furniture composited successfully (composite mode)');

      return new Response(JSON.stringify({ imageUrl, mode: 'composite' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Standard edit mode (original behavior)

    // Build content array with reference images
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    let imageIndex = 1;

    // Track image positions for prompt
    let currentRenderIndex: number;
    let layoutIndex: number | null = null;
    const styleIndices: number[] = [];
    const furnitureImageIndices: { name: string; category: string; index: number }[] = [];
    
    // Add the current render as the base image (IMAGE 1)
    content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
    currentRenderIndex = imageIndex++;

    // Add layout reference if provided (for positional accuracy)
    if (layoutImageUrl) {
      content.push({ type: 'image_url', image_url: { url: layoutImageUrl } });
      layoutIndex = imageIndex++;
    }

    // Add style references
    if (styleRefUrls && styleRefUrls.length > 0) {
      for (const styleUrl of styleRefUrls) {
        content.push({ type: 'image_url', image_url: { url: styleUrl } });
        styleIndices.push(imageIndex++);
      }
    }

    // Add each furniture item image
    const furnitureWithImages = (furnitureItems as FurnitureItem[] || []).filter(item => item.imageUrl);
    for (const item of furnitureWithImages) {
      if (item.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: item.imageUrl } });
        furnitureImageIndices.push({ 
          name: item.name, 
          category: item.category,
          index: imageIndex++ 
        });
      }
    }

    // Build the editing instruction prompt with explicit image numbering
    let editInstruction = `You are editing a room render. Follow these instructions EXACTLY:\n\n`;

    editInstruction += `IMAGE ${currentRenderIndex}: This is the CURRENT ROOM RENDER to edit.
- This is your base image - modify it according to the instructions below
- Keep the room architecture, walls, floors, windows, and lighting UNCHANGED
- Maintain the same camera angle and perspective

`;

    // Add layout reference instructions
    if (layoutIndex !== null) {
      editInstruction += `IMAGE ${layoutIndex}: This is the 2D FLOOR PLAN LAYOUT reference.
- When placing furniture, positions MUST match this layout
- Do NOT move furniture to positions that contradict this floor plan
- Use this to verify correct spatial placement

`;
    }

    // Add style reference instructions
    if (styleIndices.length > 0) {
      const styleRange = styleIndices.length === 1 
        ? `IMAGE ${styleIndices[0]}` 
        : `IMAGES ${styleIndices[0]}-${styleIndices[styleIndices.length - 1]}`;
      
      editInstruction += `${styleRange}: These are STYLE REFERENCES.
- The edited render must maintain the aesthetic from these style references
- Match the color palette, materials, and mood

`;
    }

    // Add furniture replacement instructions - ULTRA STRICT MATCHING
    if (furnitureImageIndices.length > 0) {
      editInstruction += `FURNITURE PRODUCTS TO PLACE - EXACT MATCHING REQUIRED:\n\n`;
      
      for (const { name, category, index } of furnitureImageIndices) {
        const categoryTarget = getCategoryReplacementInstruction(category);
        editInstruction += `IMAGE ${index}: "${name}"

⚠️ ABSOLUTE REQUIREMENTS FOR THIS PRODUCT:
- Find any ${categoryTarget} in the room (IMAGE ${currentRenderIndex}) and REPLACE it with this EXACT product
- COPY this product EXACTLY as shown - zero modifications allowed
- The product shape, silhouette, and proportions must be IDENTICAL to IMAGE ${index}
- Colors must match EXACTLY - do not adjust, enhance, or correct
- Material textures must be preserved PERFECTLY
- Any unique design features (curves, patterns, buttons, stitching, legs, handles) must appear IDENTICALLY
- Do NOT "improve", "adapt", or "harmonize" this product
- Do NOT generate a similar product - use THIS EXACT image

🚫 FORBIDDEN MODIFICATIONS:
- No color shifts or adjustments
- No shape modifications  
- No material changes
- No design "improvements"
- No style adaptations

VISUAL IDENTITY TO PRESERVE:
- If this product has a unique shape (curved, angular, organic) → KEEP THAT EXACT SHAPE
- If this product has specific colors → KEEP THOSE EXACT COLORS (no white-balancing)
- If this product has visible textures → REPLICATE THOSE EXACT TEXTURES
- If this product has design details (buttons, stitching, patterns) → INCLUDE ALL DETAILS

The staged product should look like it was CUT from IMAGE ${index} and PASTED into the room.
${layoutIndex !== null ? `Place according to the floor plan in IMAGE ${layoutIndex}.` : ''}

`;
      }
      
      editInstruction += `⚠️ ACCURACY CHECK WARNING:
After editing, the rendered products will be compared side-by-side with their catalog images.
The match must be PIXEL-PERFECT. Any visible differences will be flagged as errors.

CRITICAL REQUIREMENTS:
1. Products MUST appear IDENTICALLY to their reference images - this is the #1 priority
2. MAINTAIN the original 16:9 LANDSCAPE aspect ratio - output must be wide, not square
3. Replace furniture category-by-category (sofa with sofa, table with table)
4. Keep room architecture completely unchanged
5. Apply realistic lighting and shadows to placed products
6. Output dimensions must match IMAGE ${currentRenderIndex}`;
    }

    // Add user's additional instructions if provided
    if (userPrompt && userPrompt.trim()) {
      editInstruction += `\n\nAdditional user instructions: ${userPrompt}`;
    }

    content.push({ type: 'text', text: editInstruction });

    console.log('Edit instruction:', editInstruction.substring(0, 600) + '...');
    console.log('Total images in edit request:', content.filter(c => c.type === 'image_url').length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
        modalities: ['image', 'text'],
        generationConfig: {
          aspectRatio: "16:9"
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated from edit request');
    }

    console.log('Render edited successfully');

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('edit-render error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
