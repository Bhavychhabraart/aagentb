import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { prompt, category, referenceImageUrl } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating custom furniture:', { prompt, category, hasReference: !!referenceImageUrl });

    // Build a more explicit generation prompt that forces image output
    const furnitureCategory = category || 'Furniture';
    const enhancedPrompt = `GENERATE AN IMAGE: Create a professional product photograph of custom furniture.

Description: ${prompt}
Category: ${furnitureCategory}

Requirements for the image:
- Professional studio lighting with soft shadows
- Clean white or neutral gradient background  
- High-end furniture catalog photography style
- Photorealistic rendering, 8K quality
- Single isolated furniture piece, no background clutter
- Show the furniture from a 3/4 angle for best visibility
- Crisp, sharp details on materials and textures

Generate this furniture image now.`;

    // Build messages for the API
    const messages: any[] = [];
    
    if (referenceImageUrl) {
      // If reference image provided, use it as inspiration
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `GENERATE AN IMAGE based on this reference. Create a new custom furniture design inspired by the attached reference image.

${enhancedPrompt}`
          },
          {
            type: 'image_url',
            image_url: { url: referenceImageUrl }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: enhancedPrompt
      });
    }

    // Try with primary model first, then fallback
    const models = ['google/gemini-2.5-flash-image-preview', 'google/gemini-3-pro-image-preview'];
    let lastError: Error | null = null;
    let imageData: string | null = null;
    let responseMessage: string = '';

    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${model} error:`, response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Usage limit reached. Please add credits.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          lastError = new Error(`Model ${model} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`Model ${model} response received`);

        // Extract the generated image - check multiple possible locations
        imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
                    data.choices?.[0]?.message?.image?.url ||
                    data.images?.[0]?.url ||
                    null;
        
        responseMessage = data.choices?.[0]?.message?.content || '';
        
        if (imageData) {
          console.log('Image generated successfully with model:', model);
          break;
        } else {
          console.warn(`Model ${model} returned no image. Response preview:`, JSON.stringify(data).slice(0, 300));
          lastError = new Error(`Model ${model} returned no image`);
        }
      } catch (err) {
        console.error(`Error with model ${model}:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!imageData) {
      console.error('All models failed to generate image. Last error:', lastError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate furniture image. Please try again with a different description.',
          details: lastError?.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: imageData,
        message: responseMessage || 'Furniture generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-custom-furniture:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
