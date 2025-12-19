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
      prompt, 
      projectId, 
      furnitureItems,
      layoutImageUrl,
      roomPhotoUrl,
      styleRefUrls 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating render for prompt:', prompt);
    console.log('Furniture items:', furnitureItems?.length || 0);
    console.log('Layout image:', layoutImageUrl ? 'provided' : 'none');
    console.log('Room photo:', roomPhotoUrl ? 'provided' : 'none');
    console.log('Style references:', styleRefUrls?.length || 0);

    // Build content array with reference images
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    let imageIndex = 1;
    
    // Track which images are included for the prompt
    let layoutImageIndex: number | null = null;
    let roomPhotoIndex: number | null = null;
    const styleImageIndices: number[] = [];
    const furnitureImageIndices: { name: string; category: string; index: number }[] = [];

    // Add layout image first (most important for room shape)
    if (layoutImageUrl) {
      content.push({ type: 'image_url', image_url: { url: layoutImageUrl } });
      layoutImageIndex = imageIndex++;
    }

    // Add room photo
    if (roomPhotoUrl) {
      content.push({ type: 'image_url', image_url: { url: roomPhotoUrl } });
      roomPhotoIndex = imageIndex++;
    }

    // Add style reference images
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

    // Build structured prompt with NUMBERED IMAGE REFERENCES (Master Architect style)
    let structuredPrompt = `Role: Expert Interior Architect and 3D Visualizer.
Task: Generate a photorealistic interior design render.

=== REFERENCE IMAGES ===

`;

    // Layout instructions (highest priority)
    if (layoutImageIndex !== null) {
      structuredPrompt += `IMAGE ${layoutImageIndex}: 2D FLOOR PLAN LAYOUT (HIGHEST PRIORITY)
- The generated room MUST match this layout's room shape, walls, and proportions EXACTLY
- Place furniture in the EXACT positions shown in this floor plan
- Doors, windows, and openings must be in the EXACT locations shown
- The room dimensions and proportions must be pixel-accurate to this layout
- This is the MASTER reference for spatial arrangement

`;
    }

    // Room photo instructions
    if (roomPhotoIndex !== null) {
      structuredPrompt += `IMAGE ${roomPhotoIndex}: EXISTING ROOM PHOTO REFERENCE
- Match the architectural features from this photo (ceiling height, window styles, door types)
- Preserve similar structural elements and room character
- Use this for realistic architectural context

`;
    }

    // Style reference instructions
    if (styleImageIndices.length > 0) {
      const styleRange = styleImageIndices.length === 1 
        ? `IMAGE ${styleImageIndices[0]}` 
        : `IMAGES ${styleImageIndices.join(', ')}`;
      
      structuredPrompt += `${styleRange}: STYLE REFERENCES
- The final render's aesthetic MUST match these style references
- Copy the color palette, materials, textures, and finishes shown
- Replicate the mood, lighting style, and atmosphere
- The overall aesthetic must be IDENTICAL to these references

`;
    }

    // Furniture instructions with NUMBERED CHANGE LIST format
    if (furnitureImageIndices.length > 0) {
      structuredPrompt += `=== FURNITURE PRODUCTS TO INCLUDE ===

`;
      for (let i = 0; i < furnitureImageIndices.length; i++) {
        const { name, category, index } = furnitureImageIndices[i];
        structuredPrompt += `${i + 1}. "${name}" (${category})
   -> Visual Reference: IMAGE ${index}
   -> COPY this product EXACTLY as shown - zero modifications allowed
   -> Shape, silhouette, and proportions must be IDENTICAL to IMAGE ${index}
   -> Colors must match EXACTLY - do not adjust, enhance, or correct
   -> Material textures must be preserved PERFECTLY
   -> Any unique design features must appear IDENTICALLY
   ${layoutImageIndex !== null ? `-> Place according to floor plan in IMAGE ${layoutImageIndex}` : ''}

`;
      }
    }

    // Add user's prompt
    structuredPrompt += `=== USER DESIGN REQUEST ===

${prompt}

`;

    // Add furniture descriptions for context
    if (furnitureItems && furnitureItems.length > 0) {
      const furnitureDescriptions = (furnitureItems as FurnitureItem[]).map(item => 
        `${item.name} (${item.category}): ${item.description}`
      ).join('; ');
      structuredPrompt += `Furniture context: ${furnitureDescriptions}

`;
    }

    // Critical rules
    structuredPrompt += `=== CRITICAL RULES ===

1. Products MUST appear IDENTICALLY to their reference images - this is the #1 priority
2. COPY products EXACTLY - do NOT "improve", "adapt", or "harmonize" them
3. The staged products should look like they were CUT from their references and PASTED into the room
4. If a product has a unique shape → KEEP THAT EXACT SHAPE
5. If a product has specific colors → KEEP THOSE EXACT COLORS (no white-balancing)
6. If a product has visible textures → REPLICATE THOSE EXACT TEXTURES
7. If a product has design details (buttons, stitching, patterns) → INCLUDE ALL DETAILS

`;

    // Output requirements
    structuredPrompt += `=== OUTPUT REQUIREMENTS ===

1. Photorealistic quality - professional architectural visualization
2. 16:9 LANDSCAPE aspect ratio (wide cinematic format)
3. Dramatic, realistic lighting with natural shadows
4. High-end interior design aesthetic
5. All reference images must be respected in order of priority: Layout > Style > Room Photo > Furniture

⚠️ QUALITY CHECK: 
After generation, rendered products will be compared side-by-side with their catalog images.
ANY visible differences in shape, color, or details will be flagged as errors.
The goal is 100% visual accuracy.

Output: ONLY the final image.`;

    content.push({ type: 'text', text: structuredPrompt });

    console.log('Structured prompt length:', structuredPrompt.length);
    console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);

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

    console.log('Render generated successfully');

    return new Response(JSON.stringify({ imageUrl, projectId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-render error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
