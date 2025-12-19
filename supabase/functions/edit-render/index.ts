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
    const { currentRenderUrl, furnitureItems, userPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!currentRenderUrl) {
      throw new Error('Current render URL is required for editing');
    }

    console.log('Editing render with furniture items:', furnitureItems?.length || 0);
    console.log('Current render URL:', currentRenderUrl.substring(0, 100) + '...');

    // Build content array with current render and furniture images
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    // Add the current render as the base image
    content.push({
      type: 'image_url',
      image_url: { url: currentRenderUrl }
    });

    // Add each furniture item image
    const furnitureWithImages = (furnitureItems as FurnitureItem[] || []).filter(item => item.imageUrl);
    for (const item of furnitureWithImages) {
      if (item.imageUrl) {
        content.push({
          type: 'image_url',
          image_url: { url: item.imageUrl }
        });
      }
    }

    // Build the editing instruction prompt
    let editInstruction = `Edit this room render image. `;
    
    if (furnitureWithImages.length > 0) {
      editInstruction += `Replace existing furniture with the EXACT product images provided:\n\n`;
      
      furnitureWithImages.forEach((item, index) => {
        const categoryTarget = getCategoryReplacementInstruction(item.category);
        editInstruction += `${index + 1}. Find and replace the ${categoryTarget} in the room with the "${item.name}" product shown in image ${index + 2}. `;
        editInstruction += `Use the EXACT appearance, color, and design of the product image - do not interpret or change it.\n`;
      });
      
      editInstruction += `\nCRITICAL REQUIREMENTS:
- Replace furniture category-by-category (sofa with sofa, table with table, bed with bed)
- Use the EXACT product images provided - match the precise colors, materials, textures, and design
- Keep the room's walls, floor, windows, lighting, and overall architecture unchanged
- Maintain the same camera angle and perspective
- Preserve realistic lighting and shadows on the new furniture
- The replaced furniture should look naturally placed in the room`;
    }

    // Add user's additional instructions if provided
    if (userPrompt && userPrompt.trim()) {
      editInstruction += `\n\nAdditional instructions: ${userPrompt}`;
    }

    content.push({
      type: 'text',
      text: editInstruction
    });

    console.log('Edit instruction:', editInstruction.substring(0, 500) + '...');

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
