import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Camera instruction presets from reference implementation
const CAMERA_INSTRUCTIONS: Record<string, string> = {
  'eye-level': "Camera View: Standard Eye-Level perspective (approx 1.6m height).",
  'wide': "Camera View: Wide Angle Lens (16mm). Show 3 walls if possible to maximize space visibility.",
  'top-down': "Camera View: Isometric / 3/4 Top-Down Cutaway View. High angle looking down into the room.",
  'low': "Camera View: Low Angle / Hero Shot from floor level looking slightly up.",
  'corner': "Camera View: Corner Perspective. Shot from the corner of the room looking diagonally to capture the full breadth of the space.",
  'overhead': "Camera View: 90-Degree Direct Overhead (Plan View). Photorealistic top-down view showing layout and circulation.",
  'macro': "Camera View: Close-Up Detail Shot (Macro). Focus intensely on furniture materials, fabrics, and decor details with shallow depth of field.",
  'fisheye': "Camera View: Fish-Eye Lens (10mm). Artistic, distorted ultra-wide view emphasizing the scale of the room.",
  'straight-on': "Camera View: One-Point Perspective (Wes Anderson style). Perfectly symmetrical shot centered in the room, facing the back wall.",
  'isometric': "Camera View: True Isometric Projection. Technical architectural view with parallel lines (no vanishing point), showing the layout clearly from a 45-degree angle.",
  'dramatic': "Camera View: Cinematic Low-Key. High contrast, moody lighting, emphasizing shadows and form. Low angle, 35mm lens.",
  'photographer': "Camera View: Editorial Style. Carefully composed shot from a standing height (1.7m), 50mm lens, perfect vertical lines, magazine quality.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentRenderUrl,
      mode = 'grid', // 'grid' for 2x2 composite, 'individual' for specific views
      views = ['eye-level', 'top-down', 'wide', 'macro'], // Views to generate for grid
      singleView, // For individual mode
      customPrompt, // Custom angle for single view
      styleRefUrls,
      preserveAspectRatio, // NEW: Aspect ratio to preserve from source image
    } = await req.json();

    // Use provided aspect ratio or default to 16:9
    const outputAspectRatio = preserveAspectRatio || '16:9';
    console.log('Using aspect ratio:', outputAspectRatio);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!currentRenderUrl) {
      throw new Error('Current render URL is required');
    }

    console.log('Multicam generation:', mode, views);
    console.log('Current render URL:', currentRenderUrl.substring(0, 100) + '...');
    console.log('Style references:', styleRefUrls?.length || 0);

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    // IMAGE 1: Current render
    content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });

    // Add style references if available
    if (styleRefUrls && styleRefUrls.length > 0) {
      for (const styleUrl of styleRefUrls) {
        content.push({ type: 'image_url', image_url: { url: styleUrl } });
      }
    }

    let prompt: string;

    if (mode === 'grid') {
      // Generate 2x2 composite grid - all 4 views in one image
      prompt = `Role: Expert Architectural Photographer.

Task: MULTICAM PRESENTATION BOARD.

Input: An image of a designed room.

Action: Create a single composite image containing a 2x2 GRID of 4 different camera angles of this EXACT room design.

The 4 Panels must be:
1. Top-Left: ${CAMERA_INSTRUCTIONS[views[0]] || CAMERA_INSTRUCTIONS['eye-level']}
2. Top-Right: ${CAMERA_INSTRUCTIONS[views[1]] || CAMERA_INSTRUCTIONS['top-down']}
3. Bottom-Left: ${CAMERA_INSTRUCTIONS[views[2]] || CAMERA_INSTRUCTIONS['wide']}
4. Bottom-Right: ${CAMERA_INSTRUCTIONS[views[3]] || CAMERA_INSTRUCTIONS['macro']}

═══════════════════════════════════════════════════════════════
     MANDATORY: ULTRA-PHOTOREALISTIC OUTPUT QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: RED Cinema Camera / Architectural Digest quality
⚠️ NEVER produce cartoon, illustrated, stylized, or CGI-looking results
⚠️ Output MUST be indistinguishable from professional photography

CRITICAL REQUIREMENTS:
1. All 4 views must depict the SAME room with the SAME furniture, materials, and colors
2. Lighting must be consistent across all 4 panels (same time of day, same light sources)
3. Furniture placement, wall colors, and floor materials MUST be identical in all views
4. High-quality architectural presentation style
5. Seamless grid layout with thin borders between panels
6. Each panel should be properly framed for its camera angle
7. 16:9 overall aspect ratio for the composite

QUALITY CHECK:
- Materials must look physically accurate (wood grain, fabric weave, metal reflections)
- Each view must look like professional architectural photography
- NO cartoon, flat, or stylized appearance allowed

Output: ONLY the final 2x2 composite image with all 4 camera views.`;
    } else {
      // Generate individual view
      const viewInstruction = singleView 
        ? (CAMERA_INSTRUCTIONS[singleView] || CAMERA_INSTRUCTIONS['eye-level'])
        : (customPrompt || CAMERA_INSTRUCTIONS['eye-level']);

      prompt = `Role: Expert Architectural Photographer.

Task: Generate a specific camera angle view of this room.

${viewInstruction}

═══════════════════════════════════════════════════════════════
     MANDATORY: ULTRA-PHOTOREALISTIC OUTPUT QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: RED Cinema Camera / Architectural Digest quality
Camera: 8K resolution equivalent, prime lens with natural DOF
Lighting: Ray-traced global illumination with realistic shadows
Materials: Physically-based rendering with accurate reflections

⚠️ CRITICAL ANTI-ILLUSTRATION DIRECTIVE:
NEVER produce cartoon, illustrated, stylized, CGI, or video game aesthetics.
Output MUST be indistinguishable from professional architectural photography.

CRITICAL REQUIREMENTS:
1. Maintain EXACT same room design - same furniture, materials, colors
2. Only change the camera position/angle as specified
3. Preserve all architectural elements (walls, windows, doors, floor)
4. Keep the same lighting conditions and time of day
5. 16:9 aspect ratio

${customPrompt ? `CUSTOM DIRECTION: ${customPrompt}` : ''}

QUALITY CHECK:
- Must look like real architectural photography
- Materials must look physically accurate and tangible
- No cartoon, flat, or stylized appearance allowed

Output: The room rendered from the specified camera angle.`;
    }

    content.push({ type: 'text', text: prompt });

    console.log('Sending request to AI gateway for multicam generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
        generationConfig: { aspectRatio: outputAspectRatio }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in multicam response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated from multicam request');
    }

    console.log('Multicam generation completed successfully:', mode);
    
    return new Response(JSON.stringify({ 
      imageUrl, 
      mode,
      views: mode === 'grid' ? views : [singleView || 'custom'],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Multicam generation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
