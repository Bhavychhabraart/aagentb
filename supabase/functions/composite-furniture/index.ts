import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FurniturePlacement {
  name: string;
  category: string;
  imageUrl: string;
  position: { x: number; y: number }; // Percentage position (0-100)
  scale: number; // Scale factor (0.5 = 50%, 1 = 100%, 2 = 200%)
  rotation?: number; // Rotation in degrees (0-360)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      baseRenderUrl, 
      furniturePlacements,
      layoutImageUrl,
      styleRefUrls,
      preserveAspectRatio, // NEW: Aspect ratio to preserve from source image
    }: {
      baseRenderUrl: string;
      furniturePlacements: FurniturePlacement[];
      layoutImageUrl?: string;
      styleRefUrls?: string[];
      preserveAspectRatio?: string;
    } = await req.json();

    // Use provided aspect ratio or default to 16:9
    const outputAspectRatio = preserveAspectRatio || '16:9';
    console.log('Using aspect ratio:', outputAspectRatio);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!baseRenderUrl) {
      throw new Error('Base render URL is required for compositing');
    }

    if (!furniturePlacements || furniturePlacements.length === 0) {
      throw new Error('At least one furniture placement is required');
    }

    console.log('Compositing furniture items:', furniturePlacements.length);
    console.log('Base render URL:', baseRenderUrl.substring(0, 100) + '...');

    // Build content array with all images
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    let imageIndex = 1;

    // IMAGE 1: Base render
    content.push({ type: 'image_url', image_url: { url: baseRenderUrl } });
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
    for (const placement of furniturePlacements) {
      content.push({ type: 'image_url', image_url: { url: placement.imageUrl } });
      furnitureIndices.push({
        name: placement.name,
        category: placement.category,
        index: imageIndex++,
        position: placement.position,
        scale: placement.scale,
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
      // Get the rotation for this item from placements
      const placement = furniturePlacements.find(p => p.name === name);
      const rotation = placement?.rotation || 0;
      
      compositingPrompt += `
IMAGE ${index}: "${name}" (${category})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POSITION: ${position.x}% from left, ${position.y}% from top
SCALE: ${Math.round(scale * 100)}% of natural size relative to room
ROTATION: ${rotation}° clockwise from original orientation

⚠️ ABSOLUTE REQUIREMENTS:
• The product must be PIXEL-IDENTICAL to IMAGE ${index}
• Copy the EXACT shape, color, texture, and all details
• DO NOT regenerate or reinterpret - COPY EXACTLY
• ${rotation !== 0 ? `ROTATE the product ${rotation}° clockwise before placing` : 'Keep original orientation'}
• Apply realistic shadows matching room lighting direction
• Perspective should match the room's camera angle

🎯 POSITIONING:
• Place furniture so its base/center is at ${position.x}% horizontal, ${position.y}% vertical
• Scale: ${scale < 1 ? 'Make smaller than natural' : scale > 1 ? 'Make larger than natural' : 'Keep natural size'}
• ${rotation !== 0 ? `Orientation: Rotate ${rotation}° from default position` : 'Orientation: Keep as shown in reference'}
• Ensure realistic proportions relative to room size

📋 VERIFICATION CHECKLIST:
□ Product shape IDENTICAL to reference image
□ Product colors UNCHANGED from reference
□ All design details preserved (buttons, patterns, textures)
□ Positioned at correct coordinates
□ Scaled correctly
□ ${rotation !== 0 ? `Rotated ${rotation}° correctly` : 'Original orientation maintained'}
□ Shadows added matching room lighting

`;
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

    console.log('Compositing prompt:', compositingPrompt.substring(0, 800) + '...');
    console.log('Total images in composite request:', content.filter(c => c.type === 'image_url').length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
        modalities: ['image', 'text'],
        generationConfig: {
          aspectRatio: outputAspectRatio
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
      throw new Error('No image generated from composite request');
    }

    console.log('Furniture composited successfully');

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('composite-furniture error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
