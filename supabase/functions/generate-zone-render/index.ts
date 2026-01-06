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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      layoutZoneBase64,
      styleRefUrls,
      furnitureItems,
      customPrompt,
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!layoutZoneBase64) {
      throw new Error('layoutZoneBase64 is required - the cropped zone image from snipping tool');
    }

    console.log('=== GENERATE ZONE RENDER (Direct Gemini 3) ===');
    console.log('Layout zone image:', layoutZoneBase64 ? 'provided' : 'none');
    console.log('Style references:', styleRefUrls?.length || 0);
    console.log('Furniture items:', furnitureItems?.length || 0);
    console.log('Custom prompt:', customPrompt || 'none');

    // Build content array - LAYOUT ZONE IMAGE IS THE PRIMARY INPUT
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    let imageIndex = 1;
    
    // Track image positions
    let layoutZoneIndex: number | null = null;
    const styleImageIndices: number[] = [];
    const furnitureImageIndices: { name: string; category: string; index: number }[] = [];

    // Add style reference images FIRST
    if (styleRefUrls && styleRefUrls.length > 0) {
      for (const styleUrl of styleRefUrls) {
        content.push({ type: 'image_url', image_url: { url: styleUrl } });
        styleImageIndices.push(imageIndex++);
      }
    }

    // Add furniture images
    const furnitureWithImages = (furnitureItems as FurnitureItem[] || []).filter(item => item.imageUrl);
    for (const item of furnitureWithImages) {
      if (item.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: item.imageUrl } });
        furnitureImageIndices.push({ name: item.name, category: item.category, index: imageIndex++ });
      }
    }

    // Add LAYOUT ZONE IMAGE LAST (most important - AI pays more attention to recent images)
    content.push({ type: 'image_url', image_url: { url: layoutZoneBase64 } });
    layoutZoneIndex = imageIndex++;

    // Build the focused prompt for zone-to-isometric conversion
    let prompt = `You are an EXPERT 3D architectural visualization artist. Your specialty is converting 2D floor plan zones into PHOTOREALISTIC isometric 3D interior renders.

╔═══════════════════════════════════════════════════════════════════════════════╗
║              TASK: CONVERT 2D FLOOR PLAN TO 3D ISOMETRIC RENDER               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

IMAGE ${layoutZoneIndex}: 2D FLOOR PLAN ZONE (THE PRIMARY SOURCE - ABSOLUTE AUTHORITY)

This is a cropped section of a 2D floor plan. Your job is to:
1. IDENTIFY every furniture shape, wall, window, and door in this floor plan
2. UNDERSTAND the exact positions and proportions of all elements
3. CONVERT this 2D view into a PHOTOREALISTIC 3D isometric render

═══════════════════════════════════════════════════════════════
                    ACCURACY REQUIREMENTS (CRITICAL)
═══════════════════════════════════════════════════════════════

✓ EVERY furniture piece visible in the floor plan MUST appear in the 3D render
✓ Positions MUST match EXACTLY (if something is in the left half of the floor plan, it's in the left half of the render)
✓ Proportions and relative sizes MUST be preserved
✓ Wall positions, windows, and doors MUST match the floor plan
✓ The spatial relationships between items MUST be identical

═══════════════════════════════════════════════════════════════
                    ISOMETRIC CAMERA (MANDATORY)
═══════════════════════════════════════════════════════════════

CAMERA POSITION: ISOMETRIC VIEW (45° elevated corner)
- Elevation: 30-45° above ground plane
- Rotation: 45° diagonal corner view
- Shows: Floor plane + two adjacent walls
- Full zone visibility - everything in frame
- Near-orthographic projection (minimal distortion)

Visual Reference:
     ╱‾‾‾‾‾‾‾‾╲
    ╱   CEILING  ╲
   ╱______________╲
   ╲      |      ╱
    ╲ WALL | WALL╱
     ╲____|____╱
         FLOOR

DO NOT render from:
✗ Eye-level perspective
✗ Bird's-eye/top-down view
✗ Front-facing flat view

═══════════════════════════════════════════════════════════════
                    PHOTOREALISTIC QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: ULTRA-PHOTOREALISTIC
Reference Quality: RED Cinema Camera, Architectural Digest, Dwell Magazine

MUST INCLUDE:
• Physically-based rendering (PBR) for all materials
• Ray-traced global illumination
• Natural lighting through windows
• Accurate shadows with soft falloff
• Realistic material textures (wood grain, fabric weave, metal reflections)
• Contact shadows and ambient occlusion
• 8K equivalent sharpness

MUST AVOID:
✗ Cartoon, illustrated, or stylized aesthetics
✗ Video game or CGI appearance
✗ Flat colors or fake materials
✗ Plastic-looking surfaces

`;

    // Add style reference instructions
    if (styleImageIndices.length > 0) {
      const styleRange = styleImageIndices.length === 1 
        ? `IMAGE ${styleImageIndices[0]}` 
        : `IMAGES ${styleImageIndices.join(', ')}`;
      
      prompt += `
═══════════════════════════════════════════════════════════════
                    STYLE REFERENCES
═══════════════════════════════════════════════════════════════

${styleRange}: STYLE REFERENCES
- Match the aesthetic, mood, and atmosphere from these references
- Copy the color palette, materials, and finishes
- Replicate the lighting style and ambiance

`;
    }

    // Add furniture instructions
    if (furnitureImageIndices.length > 0) {
      prompt += `
═══════════════════════════════════════════════════════════════
                    SPECIFIC FURNITURE PRODUCTS
═══════════════════════════════════════════════════════════════

The following specific products should be included in the render:

`;
      for (const { name, category, index } of furnitureImageIndices) {
        prompt += `• "${name}" (${category}) - See IMAGE ${index}
  → Copy this product EXACTLY as shown
  → Shape, colors, and materials must match perfectly
  → Place according to floor plan layout

`;
      }
    }

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `
═══════════════════════════════════════════════════════════════
                    ADDITIONAL REQUIREMENTS
═══════════════════════════════════════════════════════════════

${customPrompt}

`;
    }

    // Final output requirements
    prompt += `
═══════════════════════════════════════════════════════════════
                    OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. ULTRA-PHOTOREALISTIC quality - must look like a real photograph
2. ISOMETRIC CAMERA ANGLE - 45° elevated corner view (MANDATORY)
3. 16:9 LANDSCAPE aspect ratio
4. ALL furniture from the floor plan visible and correctly positioned
5. Magazine cover quality (Architectural Digest standard)

⚠️ VERIFICATION BEFORE OUTPUT:
□ Every furniture piece from floor plan is in the render
□ Positions match the floor plan layout
□ Isometric camera angle (not eye-level, not top-down)
□ Photorealistic quality achieved

Output: ONLY the final ultra-photorealistic isometric 3D render.`;

    content.push({ type: 'text', text: prompt });

    console.log('Prompt length:', prompt.length);
    console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);

    // Call Gemini 3 Pro Image directly - same as homepage generation
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
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Zone render generated successfully');

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-zone-render error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
