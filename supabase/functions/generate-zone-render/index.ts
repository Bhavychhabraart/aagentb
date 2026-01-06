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

    console.log('=== GENERATE ZONE RENDER (Gemini 3 Pro Image) ===');
    console.log('Layout zone image:', layoutZoneBase64 ? 'provided' : 'none');
    console.log('Style references:', styleRefUrls?.length || 0);
    console.log('Furniture items:', furnitureItems?.length || 0);
    console.log('Custom prompt:', customPrompt || 'none');

    // Build content array - LAYOUT ZONE IMAGE IS THE PRIMARY INPUT
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Add style reference images first
    if (styleRefUrls && styleRefUrls.length > 0) {
      for (const styleUrl of styleRefUrls) {
        content.push({ type: 'image_url', image_url: { url: styleUrl } });
      }
    }

    // Add furniture images
    const furnitureWithImages = (furnitureItems as FurnitureItem[] || []).filter(item => item.imageUrl);
    for (const item of furnitureWithImages) {
      if (item.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: item.imageUrl } });
      }
    }

    // Add LAYOUT ZONE IMAGE LAST (most important - AI pays more attention to recent images)
    content.push({ type: 'image_url', image_url: { url: layoutZoneBase64 } });

    // Simple, focused prompt that lets Nano Banana do its step-by-step analysis
    let prompt = `Convert this 2D floor plan layout into a photorealistic isometric 3D interior render.

PROCESS:
1. First analyze the floor plan to understand all elements - furniture positions, walls, windows, doors
2. Note the exact positions and proportions of every item
3. Determine appropriate materials and textures for each element
4. Create an isometric 3D render (45° elevated corner view) that matches the floor plan EXACTLY
5. Verify every furniture piece is in the correct position before completing

REQUIREMENTS:
- EVERY furniture item in the floor plan must appear in the render at the EXACT same position
- Photorealistic quality - like a real photograph
- Isometric camera angle (elevated corner view showing floor + two walls)
- Natural lighting and realistic materials`;

    // Add style reference note if provided
    if (styleRefUrls && styleRefUrls.length > 0) {
      prompt += `\n\nSTYLE: Match the aesthetic, colors, and materials from the style reference images provided.`;
    }

    // Add furniture product note if provided
    if (furnitureWithImages.length > 0) {
      const furnitureNames = furnitureWithImages.map(f => f.name).join(', ');
      prompt += `\n\nFURNITURE: Include these specific products exactly as shown in their reference images: ${furnitureNames}`;
    }

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `\n\nADDITIONAL NOTES: ${customPrompt}`;
    }

    prompt += `\n\nOutput: A single photorealistic isometric 3D render of this floor plan.`;

    content.push({ type: 'text', text: prompt });

    console.log('Prompt length:', prompt.length);
    console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);

    // Call Gemini 3 Pro Image model with structured analysis prompt
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
