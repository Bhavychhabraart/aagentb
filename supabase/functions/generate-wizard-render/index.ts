import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlacedProduct {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  position: { x: number; y: number };
  dimensions?: { width: number; depth: number; height: number };
  description?: string;
  isCustom: boolean;
}

interface RenderRequest {
  layoutImageUrl?: string;
  roomDimensions?: { width: number; depth: number; unit: string };
  roomType?: string;
  placedProducts: PlacedProduct[];
  colorPalette: string[];
  styleReferences: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RenderRequest = await req.json();
    const { layoutImageUrl, roomDimensions, roomType, placedProducts, colorPalette, styleReferences } = body;

    // Build a detailed prompt for the AI
    const productDescriptions = placedProducts.map((p, i) => {
      const positionDesc = p.position.x < 33 
        ? 'left side' 
        : p.position.x > 66 
          ? 'right side' 
          : 'center';
      const depthDesc = p.position.y < 33 
        ? 'near the viewer' 
        : p.position.y > 66 
          ? 'far from the viewer' 
          : 'middle depth';
      
      return `${i + 1}. ${p.name} (${p.category}) - positioned on the ${positionDesc}, ${depthDesc}${p.description ? `. ${p.description}` : ''}`;
    }).join('\n');

    const colorDescription = colorPalette.length > 0 
      ? `Color palette: ${colorPalette.join(', ')}`
      : 'Neutral, elegant color scheme';

    const prompt = `
Generate a photorealistic interior render of a ${roomType || 'modern living room'}.
Room dimensions: ${roomDimensions ? `${roomDimensions.width} x ${roomDimensions.depth} ${roomDimensions.unit}` : '20 x 15 feet'}

Furniture placement:
${productDescriptions || 'Minimal furniture arrangement'}

${colorDescription}

Style: Modern, warm lighting, afternoon sun coming through windows, high-end interior design photography, 8K quality, architectural visualization.
Camera angle: Wide-angle shot from corner, showing the full room layout.
    `.trim();

    console.log('Generating render with prompt:', prompt);

    // Call Gemini 3 for image generation
    // For now, we'll return a placeholder since we need to set up the actual API call
    // In production, this would call the Gemini API or similar
    
    const renderUrl = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200';

    return new Response(
      JSON.stringify({
        success: true,
        renderUrl,
        prompt,
        productPositions: placedProducts.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
        })),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating render:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        // Return placeholder on error
        renderUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
