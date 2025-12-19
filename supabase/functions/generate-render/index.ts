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
    const { prompt, projectId, furnitureItems } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating render for prompt:', prompt);
    console.log('Furniture items:', furnitureItems?.length || 0);

    // Build enhanced prompt with furniture context
    let enhancedPrompt = `Generate a photorealistic interior design render in wide 16:9 landscape format: ${prompt}. Compose the image horizontally like a cinematic movie frame at 1920x1080 proportions. Professional architectural visualization with dramatic lighting, realistic materials, and modern high-end interior design aesthetic.`;

    if (furnitureItems && furnitureItems.length > 0) {
      const furnitureDescriptions = (furnitureItems as FurnitureItem[]).map(item => 
        `${item.name} (${item.category}): ${item.description}`
      ).join('; ');
      
      enhancedPrompt += ` IMPORTANT: The design MUST prominently feature these specific furniture pieces: ${furnitureDescriptions}. Integrate these items naturally into the room composition as key focal points.`;
      
      console.log('Enhanced prompt with furniture:', enhancedPrompt.substring(0, 500) + '...');
    }

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
            content: enhancedPrompt,
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
