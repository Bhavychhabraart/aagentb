import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  imageUrl: string;
  furnitureName: string;
  dimensions?: {
    width?: string;
    depth?: string;
    height?: string;
  };
  materials?: string[];
  drawingType: 'orthographic' | 'assembly' | 'joinery' | 'full';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, furnitureName, dimensions, materials, drawingType }: RequestBody = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build dimension string
    let dimensionStr = '';
    if (dimensions) {
      const dims = [];
      if (dimensions.width) dims.push(`Width: ${dimensions.width}cm`);
      if (dimensions.depth) dims.push(`Depth: ${dimensions.depth}cm`);
      if (dimensions.height) dims.push(`Height: ${dimensions.height}cm`);
      dimensionStr = dims.length > 0 ? dims.join(', ') : 'Estimate from image proportions';
    }

    // Build materials string
    const materialsStr = materials && materials.length > 0 
      ? materials.join(', ') 
      : 'Determine from image';

    // Drawing type specific prompts
    const drawingPrompts: Record<string, string> = {
      orthographic: `Create a professional engineering orthographic projection technical drawing with:
- Front elevation view with all vertical and horizontal dimensions clearly marked
- Side elevation view (right side) with depth measurements
- Top/plan view showing width and depth
- All three views properly aligned in third-angle projection
- Clean black line work on pure white background
- Dimension lines with arrows and measurements in centimeters
- Hidden lines shown as dashed lines
- Center lines where appropriate
- Material annotations and callouts
- Scale indicator (e.g., 1:10)
- Title block area at bottom right`,

      assembly: `Create a professional exploded/assembly diagram technical drawing showing:
- All individual components separated and offset to show assembly sequence
- Assembly order numbers (1, 2, 3, etc.) for each part
- Connection lines or arrows showing how parts fit together
- Part labels/identifiers (A, B, C or descriptive names)
- Hardware callouts (screws, bolts, dowels, brackets)
- Bill of materials reference numbers
- Clean black line work on white background
- Isometric or perspective exploded view
- Clear spacing between components`,

      joinery: `Create detailed joinery and construction technical drawings showing:
- Cross-section views of all major joints
- Mortise and tenon details if applicable
- Dowel or screw locations with dimensions
- Edge profiles and chamfers
- Material thickness callouts
- Close-up detail views of complex joints
- Section cut indicators on main drawing
- Construction notes and specifications
- Clean technical line drawing style
- Dimensions for all joint components`,

      full: `Create a comprehensive technical drawing sheet containing:
- Main orthographic views (front, side, top) with full dimensions
- One isometric/3D view for reference
- One exploded assembly view showing parts separation
- Key joinery detail callouts
- Complete dimension annotations in centimeters
- Material specifications list
- Hardware schedule if applicable
- Title block with name, scale, date placeholder
- Professional CAD/drafting appearance
- All views properly arranged on single sheet
- Clean black lines on white background`
    };

    const prompt = `Generate a professional manufacturing-ready technical drawing for: "${furnitureName}"

${drawingPrompts[drawingType]}

Specifications:
- Dimensions: ${dimensionStr}
- Materials: ${materialsStr}

Requirements:
- Use clean, precise black line work only (no shading, no colors, no gradients)
- Pure white background
- Include all dimension lines with measurement values
- Follow ISO/ANSI drafting standards
- Make it suitable for a furniture workshop/manufacturer
- Lines should be crisp and technical, not sketchy
- Text should be clear and readable engineering font style`;

    console.log('Generating technical drawing for:', furnitureName);
    console.log('Drawing type:', drawingType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the generated image
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageUrl) {
      console.error('No image in response:', JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'No image generated. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: generatedImageUrl,
        drawingType,
        message: `${drawingType.charAt(0).toUpperCase() + drawingType.slice(1)} drawing generated successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating technical drawing:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
