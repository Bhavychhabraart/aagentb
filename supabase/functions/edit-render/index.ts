import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Camera instruction presets for detailed view generation
// ISOMETRIC is the PRIMARY view type for zone generation (maximum accuracy)
const CAMERA_INSTRUCTIONS: Record<string, string> = {
  'isometric': `Camera View: TRUE ISOMETRIC PROJECTION - MAXIMUM ACCURACY MODE
   - 30-45 degree elevation angle from horizontal
   - 45 degree rotation from room corner
   - NO perspective distortion - all parallel lines remain parallel
   - Equal visual weight to all three visible axes (X, Y, Z)
   - Technical architectural visualization quality
   - Shows furniture positions EXACTLY as they appear in the 2D floor plan
   - The ENTIRE zone area must be visible with consistent scale throughout`,
  'eye-level': "Camera View: Standard Eye-Level perspective (approx 1.6m height).",
  'wide': "Camera View: Wide Angle Lens (16mm). Show 3 walls if possible to maximize space visibility.",
  'top-down': "Camera View: Isometric / 3/4 Top-Down Cutaway View. High angle looking down into the room.",
  'low': "Camera View: Low Angle / Hero Shot from floor level looking slightly up.",
  'corner': "Camera View: Corner Perspective. Shot from the corner of the room looking diagonally to capture the full breadth of the space.",
  'overhead': "Camera View: 90-Degree Direct Overhead (Plan View). Photorealistic top-down view showing layout and circulation.",
  'macro': "Camera View: Close-Up Detail Shot (Macro). Focus intensely on furniture materials, fabrics, and decor details with shallow depth of field.",
  'fisheye': "Camera View: Fish-Eye Lens (10mm). Artistic, distorted ultra-wide view emphasizing the scale of the room.",
  'straight-on': "Camera View: One-Point Perspective (Wes Anderson style). Perfectly symmetrical shot centered in the room, facing the back wall.",
  'dramatic': "Camera View: Cinematic Low-Key. High contrast, moody lighting, emphasizing shadows and form. Low angle, 35mm lens.",
  'photographer': "Camera View: Editorial Style. Carefully composed shot from a standing height (1.7m), 50mm lens, perfect vertical lines, magazine quality.",
  'detail': "Camera View: Detail Shot. Close focus on specific furniture piece with shallow depth of field.",
  'cinematic': "Camera View: Cinematic Wide. 35mm lens, dramatic lighting, film-quality composition.",
  'bird-eye': "Camera View: Bird's Eye Elevated view. High angle looking down from elevated position.",
};

interface FurnitureItem {
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  position?: { x: number; y: number };
  scale?: number;
  originalLabel?: string;
}

interface LayoutAnalysis {
  roomShape: string;
  dimensions: { width: number; depth: number; height: number; unit: string };
  aspectRatio: string;
  walls: { position: string; length: number; features: { type: string; positionPercent: number; widthPercent: number }[] }[];
  windows: { wall: string; positionPercent: number; widthPercent: number; heightPercent: number; type: string }[];
  doors: { wall: string; positionPercent: number; widthPercent: number; type: string; swingDirection: string }[];
  furnitureZones: { name: string; label: string; xStart: number; xEnd: number; yStart: number; yEnd: number; suggestedItems: string[] }[];
  cameraRecommendation: { position: string; angle: number; height: string; fov: string };
}

// Convert coordinates to natural language spatial description
function getPositionDescription(x: number, y: number): string {
  let positionDesc = "in the room";
  
  if (y < 33) positionDesc = "in the background/top area";
  else if (y > 66) positionDesc = "in the foreground/bottom area";
  else positionDesc = "in the middle ground";

  if (x < 33) positionDesc += " on the left side";
  else if (x > 66) positionDesc += " on the right side";
  else positionDesc += " in the center";
  
  return positionDesc;
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

// Find the matching furniture zone for a given position
function findZoneForPosition(x: number, y: number, zones: LayoutAnalysis['furnitureZones']): string | null {
  for (const zone of zones) {
    if (x >= zone.xStart && x <= zone.xEnd && y >= zone.yStart && y <= zone.yEnd) {
      return zone.label;
    }
  }
  return null;
}

// Build layout constraints string with STRONG enforcement
function buildLayoutConstraints(analysis: LayoutAnalysis): string {
  return `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ⚠️ LAYOUT ACCURACY - HIGHEST PRIORITY ⚠️                    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  THE FLOOR PLAN LAYOUT IS THE ABSOLUTE AUTHORITY FOR THIS RENDER              ║
║  ANY DEVIATION FROM THE LAYOUT = AUTOMATIC REJECTION                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

MANDATORY ROOM SPECIFICATIONS (FROM FLOOR PLAN ANALYSIS):
═══════════════════════════════════════════════════════════════
Room Shape: ${analysis.roomShape.toUpperCase()}
Dimensions: ${analysis.dimensions.width}×${analysis.dimensions.depth}${analysis.dimensions.unit === 'feet' ? 'ft' : 'm'}

WINDOW COUNT: EXACTLY ${analysis.windows.length} windows - NO MORE, NO LESS
${analysis.windows.map((w, i) => `  Window ${i + 1}: ${w.wall} wall at ${Math.round(w.positionPercent)}% from left corner`).join('\n') || '  (No windows)'}

DOOR COUNT: EXACTLY ${analysis.doors.length} doors - NO MORE, NO LESS
${analysis.doors.map((d, i) => `  Door ${i + 1}: ${d.wall} wall at ${Math.round(d.positionPercent)}% from left corner`).join('\n') || '  (No doors)'}

FURNITURE ZONES (place items ONLY within these zones):
${analysis.furnitureZones.map(z => `• ${z.label}: X(${z.xStart}-${z.xEnd}%) Y(${z.yStart}-${z.yEnd}%)`).join('\n')}

⚠️ CRITICAL CONSTRAINTS:
✓ Window count MUST be EXACTLY ${analysis.windows.length}
✓ Door count MUST be EXACTLY ${analysis.doors.length}
✓ Room proportions MUST match ${analysis.dimensions.width}:${analysis.dimensions.depth} ratio
✓ Do NOT add, remove, or reposition any windows/doors
✓ Do NOT modify walls, floors, or ceilings
═══════════════════════════════════════════════════════════════
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentRenderUrl, 
      furnitureItems, 
      userPrompt,
      layoutImageUrl,
      styleRefUrls,
      layoutAnalysis,
      compositeMode = false,
      maskRegion, // For selective area editing { x, y, width, height } as percentages
      maskImageBase64, // NEW: Base64 encoded mask image (white area = edit, black = preserve)
      catalogItem, // For catalog-based selective edit { name, category, description, imageUrl }
      referenceImageUrl, // NEW: Reference image for uploads mode
      textOnlyEdit = false, // NEW: For text-only edits without furniture
      focusRegion, // For zone-focused camera views { x, y, width, height } as percentages
      viewType = 'detail', // Type of camera view: detail, cinematic, eye-level, dramatic, bird-eye
      zoneImageBase64, // Cropped zone image for accurate zone reproduction (from render)
      layoutZoneBase64, // NEW: Cropped zone from 2D layout (source of truth for layout-based zones)
      layoutBasedZone = false, // NEW: Flag indicating this is a layout-based zone generation
      preserveAspectRatio, // Aspect ratio to preserve from source image (e.g., '16:9', '4:3', '1:1')
      batchMarkers, // Batch marker staging - array of { position: {x,y}, product: {...} }
    } = await req.json();

    // Use provided aspect ratio or default to 16:9
    const outputAspectRatio = preserveAspectRatio || '16:9';
    console.log('Using aspect ratio:', outputAspectRatio);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!currentRenderUrl) {
      throw new Error('Current render URL is required for editing');
    }

    console.log('Editing render with furniture items:', furnitureItems?.length || 0);
    console.log('Current render URL:', currentRenderUrl.substring(0, 100) + '...');
    console.log('Layout reference:', layoutImageUrl ? 'provided' : 'none');
    console.log('Layout analysis:', layoutAnalysis ? 'provided (111% accuracy mode)' : 'none');
    console.log('Style references:', styleRefUrls?.length || 0);
    console.log('Composite mode:', compositeMode);
    console.log('Text-only edit:', textOnlyEdit);
    console.log('Mask region:', maskRegion ? `${maskRegion.x}%,${maskRegion.y}% (${maskRegion.width}%×${maskRegion.height}%)` : 'none');
    console.log('Mask image:', maskImageBase64 ? 'provided (base64)' : 'none');
    console.log('Catalog item:', catalogItem ? catalogItem.name : 'none');
    console.log('Reference image:', referenceImageUrl ? 'provided' : 'none');
    console.log('Focus region:', focusRegion ? `${focusRegion.x}%,${focusRegion.y}% (${focusRegion.width}%×${focusRegion.height}%)` : 'none');
    console.log('View type:', viewType);
    console.log('Layout-based zone:', layoutBasedZone);
    console.log('Layout zone image:', layoutZoneBase64 ? 'provided (base64)' : 'none');
    console.log('Edit instruction length:', userPrompt?.length || 0);

    // Handle TEXT-ONLY EDIT mode (no furniture items, just a prompt)
    if (textOnlyEdit && userPrompt && (!furnitureItems || furnitureItems.length === 0)) {
      console.log('Using TEXT-ONLY EDIT mode');
      
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      // IMAGE 1: Current render
      content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
      
      // Add style references if available
      if (styleRefUrls && styleRefUrls.length > 0) {
        for (const styleUrl of styleRefUrls) {
          content.push({ type: 'image_url', image_url: { url: styleUrl } });
        }
      }
      
      const textEditPrompt = `You are an expert architectural photographer and image editor. Edit the room image (IMAGE 1) according to the user's instruction.

═══════════════════════════════════════════════════════════════
     MANDATORY: ULTRA-PHOTOREALISTIC OUTPUT QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: RED Cinema Camera / Architectural Digest quality
⚠️ NEVER produce cartoon, illustrated, stylized, or CGI-looking results
⚠️ Output MUST be indistinguishable from professional photography

⚠️ CRITICAL IMAGE PRESERVATION:
- The output image MUST have the EXACT same dimensions, framing, and boundaries as IMAGE 1
- Do NOT crop, zoom, pan, or reframe the image in any way
- Maintain the EXACT same field of view as the input image
- Keep all visible elements at their exact positions

USER INSTRUCTION: ${userPrompt}

CRITICAL RULES:
1. Apply the requested changes while preserving the overall room structure
2. Keep architectural elements (walls, windows, doors, floor) in their exact positions
3. Maintain the same camera angle and perspective - NO CROPPING OR ZOOMING
4. Preserve furniture that is NOT mentioned in the instruction
5. Apply changes naturally with ray-traced lighting and realistic shadows
6. The result MUST look like a professional photograph, NOT an illustration
7. Use physically-based materials with accurate reflections
8. Maintain 8K equivalent sharpness and detail
${styleRefUrls?.length ? '\n9. Match the aesthetic style from the provided style reference images' : ''}

QUALITY CHECK:
- Must look like real architectural photography
- Materials must look physically accurate and tangible
- No cartoon, flat, or stylized appearance allowed
- Output dimensions and framing MUST match input exactly

Output: The edited room image with ultra-photorealistic quality.`;

      content.push({ type: 'text', text: textEditPrompt });

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
        throw new Error('No image generated from text-only edit request');
      }

      console.log('Text-only edit completed successfully');
      return new Response(JSON.stringify({ imageUrl, mode: 'text-only-edit' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle ZONE FOCUS / CAMERA VIEW mode - for generating focused views of specific regions
    if (focusRegion && userPrompt && !maskRegion) {
      console.log('Using ZONE FOCUS mode with viewType:', viewType);
      console.log('Layout-based zone:', layoutBasedZone);
      console.log('Layout zone image provided:', layoutZoneBase64 ? 'yes (base64)' : 'no');
      console.log('Render zone image provided:', zoneImageBase64 ? 'yes (base64)' : 'no');
      
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      let imageIndex = 1;
      
      // Build view-specific camera instructions using the detailed presets
      const viewInstruction = CAMERA_INSTRUCTIONS[viewType] || CAMERA_INSTRUCTIONS['detail'];
      
      // Build prompt based on whether this is a layout-based zone generation
      let zonePrompt: string;
      
      if (layoutBasedZone && layoutZoneBase64) {
        // ═══════════════════════════════════════════════════════════════════════════
        // TWO-STAGE PIPELINE: Gemini 2.5 Analysis → Precise Prompt → Gemini 3 Gen
        // ═══════════════════════════════════════════════════════════════════════════
        console.log('=== STAGE 1: ZONE ANALYSIS WITH GEMINI 2.5 PRO ===');
        console.log('Analyzing cropped zone image to extract precise furniture layout...');
        
        // STAGE 1: Analyze the zone with Gemini 2.5 Pro (text/vision)
        const analysisPrompt = `You are an expert floor plan analyst. Analyze this 2D floor plan zone image and extract PRECISE information about every element visible.

ANALYZE THE IMAGE AND RETURN A JSON OBJECT with this exact structure:

{
  "zoneType": "living_area | dining_area | bedroom | office | kitchen | hallway | bathroom",
  "estimatedDimensions": {
    "widthFeet": <estimated width in feet>,
    "depthFeet": <estimated depth in feet>,
    "aspectRatio": "<width:height ratio like 4:3 or 16:9>"
  },
  "furniture": [
    {
      "type": "<exact furniture type: sofa, armchair, coffee_table, dining_table, bed, desk, etc>",
      "shape": "rectangular | circular | L-shaped | irregular",
      "centerX": <0-100 percentage from left edge>,
      "centerY": <0-100 percentage from top edge>,
      "widthPercent": <0-100 percentage of total zone width>,
      "heightPercent": <0-100 percentage of total zone height>,
      "rotationDegrees": <0, 45, 90, 135, 180, etc>,
      "facingDirection": "north | south | east | west | ne | nw | se | sw",
      "estimatedRealSize": "<like '7ft sofa' or '4ft round table'>"
    }
  ],
  "architecturalFeatures": [
    {
      "type": "window | door | opening | column | stairs",
      "wall": "top | bottom | left | right | center",
      "positionPercent": <0-100 along that wall>,
      "widthPercent": <0-100 width as percentage>
    }
  ],
  "spatialRelationships": [
    "<description like 'sofa faces the window on the top wall'>",
    "<description like 'coffee table is centered in front of sofa'>",
    "<description like 'armchairs flank the sofa on both sides'>"
  ],
  "sceneDescription": "<A detailed 2-3 sentence description of what this zone represents, the overall arrangement, and the likely function of the space>"
}

IMPORTANT RULES:
1. Identify EVERY distinct shape as a piece of furniture
2. Be PRECISE about positions - use percentages from 0-100
3. Note the ORIENTATION/ROTATION of each piece
4. Identify relationships between furniture pieces
5. Include ALL windows and doors visible in the zone
6. Output ONLY valid JSON, no markdown or explanation

Analyze the floor plan zone image now:`;

        const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [{
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: layoutZoneBase64 } },
                { type: 'text', text: analysisPrompt }
              ]
            }],
          }),
        });

        if (!analysisResponse.ok) {
          console.error('Gemini 2.5 analysis failed:', analysisResponse.status);
          // Fall back to direct generation if analysis fails
        }

        let zoneAnalysis: any = null;
        let analysisText = '';
        
        try {
          const analysisData = await analysisResponse.json();
          analysisText = analysisData.choices?.[0]?.message?.content || '';
          console.log('Raw analysis response:', analysisText.substring(0, 500) + '...');
          
          // Extract JSON from the response (handle markdown code blocks)
          let jsonStr = analysisText;
          const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          } else {
            // Try to find raw JSON object
            const rawJsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (rawJsonMatch) {
              jsonStr = rawJsonMatch[0];
            }
          }
          
          zoneAnalysis = JSON.parse(jsonStr);
          console.log('=== ZONE ANALYSIS COMPLETE ===');
          console.log('Zone type:', zoneAnalysis.zoneType);
          console.log('Furniture count:', zoneAnalysis.furniture?.length || 0);
          console.log('Architectural features:', zoneAnalysis.architecturalFeatures?.length || 0);
          console.log('Scene description:', zoneAnalysis.sceneDescription);
        } catch (parseError) {
          console.error('Failed to parse zone analysis:', parseError);
          console.log('Will proceed with basic prompt (analysis unavailable)');
        }

        // STAGE 2: Build PRECISE prompt from analysis
        console.log('=== STAGE 2: BUILDING PRECISE GENERATION PROMPT ===');
        
        // Extract zone bounds from focusRegion for explicit coordinates
        const zoneBounds = focusRegion ? {
          x_start: focusRegion.x,
          y_start: focusRegion.y,
          x_end: focusRegion.x + focusRegion.width,
          y_end: focusRegion.y + focusRegion.height,
          width: focusRegion.width,
          height: focusRegion.height,
        } : null;
        
        // IMAGE 1: Cropped zone from 2D layout (the source of truth)
        content.push({ type: 'image_url', image_url: { url: layoutZoneBase64 } });
        const layoutZoneIndex = imageIndex++;
        
        // IMAGE 2: Full 2D layout for context (if available)
        let fullLayoutIndex: number | null = null;
        if (layoutImageUrl) {
          content.push({ type: 'image_url', image_url: { url: layoutImageUrl } });
          fullLayoutIndex = imageIndex++;
        }
        
        // IMAGE 3: Current render for style reference (if available and different from layout)
        let renderIndex: number | null = null;
        if (currentRenderUrl && currentRenderUrl !== layoutImageUrl) {
          content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
          renderIndex = imageIndex++;
        }
        
        // Add STYLE REFERENCE images
        const styleRefIndices: number[] = [];
        if (styleRefUrls && styleRefUrls.length > 0) {
          for (const styleUrl of styleRefUrls) {
            content.push({ type: 'image_url', image_url: { url: styleUrl } });
            styleRefIndices.push(imageIndex++);
          }
          console.log('Added style references as images:', styleRefIndices);
        }
        
        // Add PRODUCT images
        const productIndices: { index: number; name: string; category: string }[] = [];
        if (furnitureItems && furnitureItems.length > 0) {
          for (const item of furnitureItems) {
            if (item.imageUrl) {
              content.push({ type: 'image_url', image_url: { url: item.imageUrl } });
              productIndices.push({ 
                index: imageIndex++, 
                name: item.name, 
                category: item.category 
              });
            }
          }
          console.log('Added product images:', productIndices.map(p => p.name));
        }
        
        // Build ANALYSIS-ENHANCED furniture placement instructions
        let furniturePlacementInstructions = '';
        if (zoneAnalysis && zoneAnalysis.furniture && zoneAnalysis.furniture.length > 0) {
          furniturePlacementInstructions = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║     AI-ANALYZED FURNITURE LAYOUT (EXTRACTED FROM 2D FLOOR PLAN)              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Zone Type: ${(zoneAnalysis.zoneType || 'unknown').toUpperCase().padEnd(55)}║
║  Dimensions: ~${zoneAnalysis.estimatedDimensions?.widthFeet || '?'}ft × ${zoneAnalysis.estimatedDimensions?.depthFeet || '?'}ft (${zoneAnalysis.estimatedDimensions?.aspectRatio || '?'})${' '.repeat(32)}║
║  Total Items: ${String(zoneAnalysis.furniture.length).padEnd(54)}║
╚═══════════════════════════════════════════════════════════════════════════════╝

PRECISE FURNITURE PLACEMENT (FOLLOW EXACTLY):
${zoneAnalysis.furniture.map((f: any, i: number) => `
┌─────────────────────────────────────────────────────────────────────────┐
│ ITEM ${i + 1}: ${(f.type || 'Unknown').toUpperCase()}
├─────────────────────────────────────────────────────────────────────────┤
│ Shape: ${f.shape || 'rectangular'}
│ Position: Center at (${f.centerX?.toFixed(1) || '?'}%, ${f.centerY?.toFixed(1) || '?'}%) from top-left
│ Size: ${f.widthPercent?.toFixed(1) || '?'}% width × ${f.heightPercent?.toFixed(1) || '?'}% height of zone
│ Rotation: ${f.rotationDegrees || 0}° | Facing: ${f.facingDirection || 'forward'}
│ Real-world size: ${f.estimatedRealSize || 'standard size'}
└─────────────────────────────────────────────────────────────────────────┘`).join('\n')}

SPATIAL RELATIONSHIPS TO MAINTAIN:
${(zoneAnalysis.spatialRelationships || []).map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') || '(none specified)'}

SCENE DESCRIPTION:
${zoneAnalysis.sceneDescription || 'Standard interior space with furniture arranged as shown in the floor plan.'}
`;
        }

        // Build architectural features section
        let architecturalSection = '';
        if (zoneAnalysis?.architecturalFeatures?.length > 0) {
          architecturalSection = `
ARCHITECTURAL FEATURES (MUST INCLUDE):
${zoneAnalysis.architecturalFeatures.map((f: any, i: number) => 
  `${i + 1}. ${f.type?.toUpperCase()}: ${f.wall} wall at ${f.positionPercent}% (width: ${f.widthPercent}%)`
).join('\n')}
`;
        }
        
        // Build style reference instructions
        const styleInstructions = styleRefIndices.length > 0 ? `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    STYLE REFERENCE MATCHING (CRITICAL)                         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
${styleRefIndices.map((idx, i) => `║  Style Reference ${i + 1} (IMAGE ${idx}): COPY THIS AESTHETIC                    ║`).join('\n')}
╚═══════════════════════════════════════════════════════════════════════════════╝

- MATCH exact color palette, mood, and atmosphere
- REPLICATE lighting style (warm/cool, soft/dramatic)  
- USE SAME material textures visible in style images` : '';

        // Build product placement instructions  
        const productInstructions = productIndices.length > 0 ? `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    PRODUCT PLACEMENT (COPY EXACTLY)                            ║
╠═══════════════════════════════════════════════════════════════════════════════╣
${productIndices.map(p => `║  "${p.name}" (${p.category}): SEE IMAGE ${p.index}                              ║`).join('\n')}
╚═══════════════════════════════════════════════════════════════════════════════╝

${productIndices.map((p, i) => `${i + 1}. "${p.name}" - COPY EXACTLY from IMAGE ${p.index}`).join('\n')}` : '';
        
        // Build image reference list
        const imageRefList = `
IMAGES PROVIDED:
- IMAGE ${layoutZoneIndex}: CROPPED 2D FLOOR PLAN ZONE - THE EXACT AREA TO RENDER
${fullLayoutIndex ? `- IMAGE ${fullLayoutIndex}: Full 2D floor plan (overall context)` : ''}
${renderIndex ? `- IMAGE ${renderIndex}: Existing 3D render (style reference)` : ''}
${styleRefIndices.length > 0 ? styleRefIndices.map((idx, i) => `- IMAGE ${idx}: Style Reference ${i + 1}`).join('\n') : ''}
${productIndices.length > 0 ? productIndices.map(p => `- IMAGE ${p.index}: Product "${p.name}"`).join('\n') : ''}`;

        zonePrompt = `You are an expert architectural renderer specializing in ISOMETRIC 3D VISUALIZATION.
${imageRefList}

╔═══════════════════════════════════════════════════════════════════════════════╗
║           ISOMETRIC 3D PROJECTION FROM ANALYZED FLOOR PLAN                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  The floor plan has been PRE-ANALYZED by AI to extract precise positions       ║
║  Follow the furniture placement instructions EXACTLY                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
${furniturePlacementInstructions}
${architecturalSection}
${styleInstructions}
${productInstructions}

═══════════════════════════════════════════════════════════════
               ISOMETRIC CAMERA REQUIREMENTS
═══════════════════════════════════════════════════════════════

1. TRUE ISOMETRIC PROJECTION:
   - Camera at EXACTLY 30-45 degree elevation angle
   - Viewing direction at 45 degrees from room corner
   - NO perspective distortion - parallel lines STAY parallel
   - All three visible axes (X, Y, Z) have equal visual weight

2. FRAMING:
   - The ENTIRE zone must be visible in the frame
   - Camera positioned to show the floor plan area from corner
   - Consistent scale across the entire image

═══════════════════════════════════════════════════════════════
               PHOTOREALISTIC QUALITY
═══════════════════════════════════════════════════════════════

- RED Cinema Camera / Architectural Digest magazine quality
- 8K resolution equivalent with crisp details
- Ray-traced global illumination with natural shadows
- Physically-based materials (wood grain, fabric weave, metal reflections)
- Natural daylight or warm interior lighting
- NO cartoon, illustration, CGI, or video game aesthetics

ADDITIONAL DIRECTION: ${userPrompt || 'Create a beautiful, realistic isometric view.'}

═══════════════════════════════════════════════════════════════
               FINAL VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════

Before outputting, verify:
✓ Isometric camera angle (30-45° elevation, corner view)
✓ NO perspective distortion (parallel lines stay parallel)
✓ EVERY furniture piece from the analysis is present at the EXACT positions specified
✓ Furniture sizes and proportions match the analysis
✓ Spatial relationships are maintained (e.g., coffee table in front of sofa)
${productIndices.length > 0 ? '✓ All specified products are included and match their reference images' : ''}
${styleRefIndices.length > 0 ? '✓ Style matches the provided reference images' : ''}
✓ Photorealistic quality - looks like a real photograph
✓ Zone boundaries respected

OUTPUT: A photorealistic ISOMETRIC 3D visualization with AI-analyzed furniture placement.`;

      } else if (zoneImageBase64) {
        // RENDER-BASED ZONE (existing behavior) - Uses cropped render as reference
        console.log('Using RENDER-BASED zone generation mode (legacy)');
        
        // IMAGE 1: Full room render (for context)
        content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
        const fullRoomIndex = imageIndex++;
        
        // IMAGE 2: Cropped zone image from render
        content.push({ type: 'image_url', image_url: { url: zoneImageBase64 } });
        const zoneIndex = imageIndex++;
        
        zonePrompt = `You are an expert architectural photographer creating magazine-quality interior photography.

IMAGES PROVIDED:
- IMAGE ${fullRoomIndex}: Full room render (for overall context and style reference)
- IMAGE ${zoneIndex}: CROPPED ZONE IMAGE - THIS IS THE EXACT CONTENT YOU MUST REPRODUCE

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

YOUR TASK:
Create a ${viewInstruction.toLowerCase()} This view must show the EXACT same content as IMAGE ${zoneIndex}.

CRITICAL REQUIREMENTS:

1. CONTENT ACCURACY (HIGHEST PRIORITY):
   - The output MUST show the EXACT SAME furniture, objects, and elements as IMAGE ${zoneIndex}
   - Do NOT add, remove, or reposition anything
   - This is an ENHANCED VIEW of existing content, NOT a new creation

2. PHOTOREALISTIC QUALITY:
   - Materials must look physically accurate (visible wood grain, fabric weave, metal reflections)
   - Lighting must be realistic with soft shadows and natural falloff
   - Must look like a professional photograph, NOT an illustration

3. VISUAL FIDELITY:
   - Maintain the EXACT same wall colors and textures
   - Keep the EXACT same floor materials and patterns
   - Match all material textures and finishes precisely

4. OUTPUT:
   - 16:9 aspect ratio image
   - Higher detail/resolution than the cropped zone
   - RED Cinema Camera / Architectural Digest quality

ADDITIONAL DIRECTION: ${userPrompt}

QUALITY CHECK: Output will be REJECTED if it looks illustrated, cartoon, or CGI.
═══════════════════════════════════════════════════════════════`;
      } else {
        // Fallback: No cropped zone image, use coordinate-based approach
        console.log('Using COORDINATE-BASED zone generation mode (fallback)');
        
        content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
        const fullRoomIndex = imageIndex++;
        
        zonePrompt = `You are a professional interior photography director. Create a new camera view of this room focusing on a specific zone.

CURRENT ROOM IMAGE (IMAGE ${fullRoomIndex}): The attached image shows the full room.

FOCUS ZONE (area to feature prominently):
- Horizontal: ${focusRegion.x.toFixed(0)}% to ${(focusRegion.x + focusRegion.width).toFixed(0)}% from left
- Vertical: ${focusRegion.y.toFixed(0)}% to ${(focusRegion.y + focusRegion.height).toFixed(0)}% from top

CAMERA STYLE: ${viewInstruction}

ADDITIONAL DIRECTION: ${userPrompt}

CRITICAL REQUIREMENTS:
1. Generate a NEW photorealistic view that focuses on and features the specified zone area
2. The zone area should be the PRIMARY subject of the new image
3. Maintain the exact same room design, furniture, materials, and lighting as the original
4. The output should feel like a different camera position/angle of the SAME room
5. Keep photorealistic quality matching or exceeding the original
6. Output a 16:9 aspect ratio image

Output: A photorealistic interior photograph showing the focused view of the specified zone.`;
      }

      content.push({ type: 'text', text: zonePrompt });
      
      // Add style references if available
      if (styleRefUrls && styleRefUrls.length > 0) {
        for (const styleUrl of styleRefUrls) {
          content.push({ type: 'image_url', image_url: { url: styleUrl } });
        }
      }

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
        console.error('No image in zone focus response:', JSON.stringify(data).substring(0, 500));
        throw new Error('No image generated from zone focus request');
      }

      console.log('Zone focus view completed successfully:', viewType, layoutBasedZone ? '(layout-based)' : (zoneImageBase64 ? '(render-based)' : '(coordinates only)'));
      return new Response(JSON.stringify({ imageUrl, mode: 'zone-focus', viewType }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle SELECTIVE AREA EDIT mode
    if (maskRegion && (userPrompt || catalogItem || referenceImageUrl)) {
      console.log('Using SELECTIVE AREA EDIT mode' + (catalogItem ? ' with catalog item' : referenceImageUrl ? ' with reference image' : ''));
      
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      let imageIndex = 1;
      
      // IMAGE 1: Current render (the room to edit)
      content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
      const renderIndex = imageIndex++;
      
      // IMAGE 2: Mask image (if provided) - WHITE = area to edit, BLACK = preserve
      let maskIndex: number | null = null;
      if (maskImageBase64) {
        content.push({ type: 'image_url', image_url: { url: maskImageBase64 } });
        maskIndex = imageIndex++;
        console.log('Added mask image as IMAGE', maskIndex);
      }
      
      // IMAGE 3: Catalog item reference OR reference image (if provided)
      let refIndex: number | null = null;
      if (catalogItem?.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: catalogItem.imageUrl } });
        refIndex = imageIndex++;
      } else if (referenceImageUrl) {
        content.push({ type: 'image_url', image_url: { url: referenceImageUrl } });
        refIndex = imageIndex++;
      }
      
      let selectivePrompt: string;
      
      // Build the mask instruction
      const maskInstruction = maskIndex 
        ? `

MASK IMAGE (IMAGE ${maskIndex}):
The WHITE area in this mask shows EXACTLY where to apply edits.
The BLACK area MUST remain completely unchanged - pixel perfect preservation.
Use this mask as a precise boundary for your edits.`
        : '';
      
      if (catalogItem) {
        // Catalog-based selective edit with product reference
        selectivePrompt = `You are an expert architectural photographer performing precision INPAINTING.

═══════════════════════════════════════════════════════════════
     ⚠️⚠️⚠️ ABSOLUTE CRITICAL - IMAGE PRESERVATION ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════

🚨 NON-NEGOTIABLE RULES - VIOLATION = COMPLETE FAILURE:
1. OUTPUT IMAGE MUST HAVE **IDENTICAL DIMENSIONS** AS IMAGE ${renderIndex}
2. DO NOT CROP, ZOOM, PAN, TILT, OR REFRAME THE IMAGE - ANY CROPPING IS WRONG
3. The ENTIRE original room must be visible in output - same framing, same boundaries
4. If the input is 1920x1080, output MUST be 1920x1080 - EXACT SAME PIXELS
5. Keep the EXACT same camera angle and field of view

═══════════════════════════════════════════════════════════════
     MANDATORY: ULTRA-PHOTOREALISTIC OUTPUT QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: RED Cinema Camera / Architectural Digest quality
⚠️ NEVER produce cartoon, illustrated, or CGI-looking results

IMAGES PROVIDED:
- IMAGE ${renderIndex}: The room to edit (PRESERVE EXACT DIMENSIONS AND FRAMING)
${maskIndex ? `- IMAGE ${maskIndex}: BLACK & WHITE MASK (WHITE = edit zone, BLACK = preserve unchanged)` : ''}
- IMAGE ${refIndex}: The product to place (COPY THIS EXACTLY)

REGION TO EDIT:
- Position: ${Math.round(maskRegion.x)}% from left, ${Math.round(maskRegion.y)}% from top
- Size: ${Math.round(maskRegion.width)}% width × ${Math.round(maskRegion.height)}% height
${maskInstruction}

PRODUCT TO PLACE:
- Name: ${catalogItem.name}
- Category: ${catalogItem.category}
- Description: ${catalogItem.description || 'Premium furniture piece'}

CRITICAL INPAINTING RULES:
1. ${maskIndex ? 'ONLY edit pixels where the mask is WHITE - leave BLACK areas completely unchanged' : 'ONLY edit content within the specified region percentage coordinates'}
2. The placed furniture must be a PIXEL-PERFECT copy of IMAGE ${refIndex}
3. Copy the EXACT shape, color, material texture, and proportions from the reference
4. Blend edges seamlessly with ray-traced lighting and realistic shadows
5. Materials must look physically accurate with proper reflections
6. Apply photorealistic shadows matching the room's lighting direction
7. 🚨 NEVER CROP OR ZOOM - output must show the ENTIRE ROOM exactly as input

${userPrompt ? `ADDITIONAL INSTRUCTIONS: ${userPrompt}` : ''}

FINAL QUALITY CHECK: 
✓ Output dimensions = Input dimensions (EXACT MATCH REQUIRED)
✓ Areas outside edit zone = IDENTICAL to IMAGE ${renderIndex}
✓ Result = professional photography, NOT illustration
✓ Entire room visible with same boundaries as input

Output: The FULL room image (same dimensions) with ONLY the masked region modified.`;
      } else if (referenceImageUrl) {
        // Upload-based selective edit with reference image
        selectivePrompt = `You are a precise image editor performing INPAINTING. Apply the reference image to the masked region.

IMAGES PROVIDED:
- IMAGE ${renderIndex}: The room to edit
${maskIndex ? `- IMAGE ${maskIndex}: BLACK & WHITE MASK (WHITE = edit zone, BLACK = preserve unchanged)` : ''}
- IMAGE ${refIndex}: Reference image to apply

REGION TO EDIT:
- Position: ${Math.round(maskRegion.x)}% from left, ${Math.round(maskRegion.y)}% from top
- Size: ${Math.round(maskRegion.width)}% width × ${Math.round(maskRegion.height)}% height
${maskInstruction}

CRITICAL INPAINTING RULES:
1. ${maskIndex ? 'ONLY edit pixels where the mask is WHITE - leave BLACK areas completely unchanged' : 'ONLY edit content within the specified region percentage coordinates'}
2. Apply the reference image naturally to the edit zone
3. Blend edges seamlessly with surrounding elements
4. Maintain consistent lighting and perspective

${userPrompt ? `INSTRUCTIONS: ${userPrompt}` : 'Apply the reference image to this area naturally.'}

Output: The room with ONLY the masked/specified region modified using the reference.`;
      } else {
        // Text-based selective edit
        selectivePrompt = `You are a precise image editor performing INPAINTING. Edit ONLY the masked region of this room image.

⚠️ CRITICAL - DO NOT CROP OR ZOOM:
- Output image MUST have EXACT same dimensions as IMAGE ${renderIndex}
- Keep the ENTIRE room visible with same framing and boundaries
- NO cropping, zooming, panning, or reframing allowed

IMAGES PROVIDED:
- IMAGE ${renderIndex}: The room to edit (PRESERVE EXACT DIMENSIONS)
${maskIndex ? `- IMAGE ${maskIndex}: BLACK & WHITE MASK (WHITE = edit zone, BLACK = preserve unchanged)` : ''}

REGION TO EDIT:
- Position: ${Math.round(maskRegion.x)}% from left, ${Math.round(maskRegion.y)}% from top
- Size: ${Math.round(maskRegion.width)}% width × ${Math.round(maskRegion.height)}% height
${maskInstruction}

EDIT INSTRUCTION: ${userPrompt}

CRITICAL INPAINTING RULES:
1. ${maskIndex ? 'ONLY edit pixels where the mask is WHITE - leave BLACK areas completely unchanged' : 'ONLY edit content within the specified region percentage coordinates'}
2. Keep EVERYTHING outside the edit zone EXACTLY unchanged - pixel perfect
3. Maintain consistent lighting, shadows, and perspective with surrounding areas
4. The edit should blend seamlessly with the rest of the image
5. Preserve the same camera angle and image quality
6. 🚨 Output dimensions MUST match input dimensions exactly

Output: The FULL edited image (same dimensions as input) with ONLY the masked/specified region modified.`;
      }

      content.push({ type: 'text', text: selectivePrompt });

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
          generationConfig: { aspectRatio: outputAspectRatio },
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
        throw new Error('No image generated from selective edit request');
      }

      const mode = catalogItem ? 'selective-catalog' : referenceImageUrl ? 'selective-upload' : 'selective-edit';
      console.log('Selective area edit completed successfully:', mode);
      return new Response(JSON.stringify({ imageUrl, mode }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // BATCH MARKER STAGING MODE - Gemini 3 Pro
    // =============================================
    // Handle batch marker staging - multiple products placed at specific coordinates in one call
    // batchMarkers is already destructured from the initial req.json() call above
    const typedBatchMarkers = batchMarkers as Array<{
      position: { x: number; y: number };
      product: { name: string; category: string; description?: string; imageUrl: string };
    }> | undefined;

    if (typedBatchMarkers && typedBatchMarkers.length > 0) {
      console.log('Using BATCH MARKER STAGING mode with Gemini 3 Pro');
      console.log('Number of markers:', typedBatchMarkers.length);

      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      let imageIndex = 1;

      // IMAGE 1: Base render
      content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
      const baseImageIndex = imageIndex++;

      // Add product reference images
      const productImageRefs: Array<{ markerIdx: number; imageIdx: number; product: typeof typedBatchMarkers[0]['product'] }> = [];
      
      for (let i = 0; i < typedBatchMarkers.length; i++) {
        const marker = typedBatchMarkers[i];
        if (marker.product.imageUrl) {
          content.push({ type: 'image_url', image_url: { url: marker.product.imageUrl } });
          productImageRefs.push({
            markerIdx: i,
            imageIdx: imageIndex++,
            product: marker.product,
          });
        }
      }

      // Build the batch prompt
      const replacementList = productImageRefs.map((ref, idx) => {
        const marker = typedBatchMarkers[ref.markerIdx];
        const posDesc = getPositionDescription(marker.position.x, marker.position.y);
        return `${idx + 1}. At coordinates (${Math.round(marker.position.x)}%, ${Math.round(marker.position.y)}%): Place "${ref.product.name}" (${ref.product.category}) → Reference: IMAGE ${ref.imageIdx}
   - Position: ${posDesc}
   - Description: ${ref.product.description || 'Premium furniture piece'}`;
      }).join('\n\n');

      const batchPrompt = `You are performing PRECISION FURNITURE INPAINTING on an existing room photograph.

═══════════════════════════════════════════════════════════════
     🔒 CAMERA LOCK - ZERO MODIFICATION TO FRAME 🔒
═══════════════════════════════════════════════════════════════

THIS IS AN INPAINTING TASK - NOT A RE-GENERATION:
• The output MUST show the EXACT SAME VIEW as IMAGE ${baseImageIndex}
• Every pixel along all 4 edges of IMAGE ${baseImageIndex} must appear in output
• Camera position: LOCKED - do not move, pan, tilt, or zoom
• Field of view: LOCKED - do not widen or narrow
• Framing: LOCKED - do not crop, reframe, or change composition

❌ REJECT: Zooming in on furniture placement areas
❌ REJECT: Cropping out any walls, ceiling, floor, or edges
❌ REJECT: Changing the camera angle or perspective
❌ REJECT: Re-composing the scene in any way
❌ REJECT: Any output that doesn't show 100% of the original boundaries

✅ REQUIRED: Output shows 100% of the original room boundaries
✅ REQUIRED: All corners and edges match the input exactly
✅ REQUIRED: Same exact framing and composition as input

═══════════════════════════════════════════════════════════════
     FURNITURE INPAINTING - ${typedBatchMarkers.length} ITEMS
═══════════════════════════════════════════════════════════════

TASK: Add/replace furniture at specific coordinates WITHOUT changing anything else.

BASE IMAGE: IMAGE ${baseImageIndex} (preserve this view EXACTLY - do NOT zoom or crop)

PLACEMENT INSTRUCTIONS:
${replacementList}

═══════════════════════════════════════════════════════════════
     PLACEMENT TECHNIQUE
═══════════════════════════════════════════════════════════════

For each product:
1. LOCATE the coordinate (X%, Y%) in the base image
2. If furniture exists there → REPLACE it with the reference product
3. If empty space → ADD the product naturally
4. MATCH the product exactly from its reference image
5. Apply correct perspective scaling for room depth
6. Add realistic shadows matching room lighting

CRITICAL REMINDERS:
• Do NOT focus or zoom on the furniture being placed
• Keep the ENTIRE room visible at all times
• The output must look like someone placed real furniture in the photo
• Preserve the original photograph's framing completely

═══════════════════════════════════════════════════════════════
     OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

• SAME DIMENSIONS as IMAGE ${baseImageIndex}
• SAME FRAMING as IMAGE ${baseImageIndex}  
• SAME VIEW as IMAGE ${baseImageIndex}
• Photorealistic quality - indistinguishable from real photo
• All ${typedBatchMarkers.length} products placed at specified coordinates

OUTPUT: The COMPLETE, UNMODIFIED FRAME of the room with only the furniture changed.`;

      content.push({ type: 'text', text: batchPrompt });

      console.log('Batch staging prompt built. Total images:', content.filter(c => c.type === 'image_url').length);

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
          generationConfig: { aspectRatio: outputAspectRatio },
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
        console.error('AI gateway error (batch staging):', response.status, errorText);
        throw new Error(`AI gateway error: ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error('No image generated from batch marker staging request');
      }

      console.log('Batch marker staging completed successfully with', batchMarkers.length, 'items');
      return new Response(JSON.stringify({ 
        imageUrl, 
        mode: 'batch-marker-staging',
        itemCount: batchMarkers.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = layoutAnalysis as LayoutAnalysis | undefined;

    // Check if we have furniture items with position data for Master Staging
    const furnitureWithPositions = (furnitureItems as FurnitureItem[] || []).filter(
      item => item.imageUrl && item.position && item.scale !== undefined
    );

    if (compositeMode && furnitureWithPositions.length > 0) {
      console.log('Using MASTER STAGING ARCHITECT mode for precise placement');
      
      // Build content array with numbered image references
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      let imageIndex = 1;

      // IMAGE 1: Base render (the room to edit)
      content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
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

      // Build NUMBERED CHANGE LIST
      let changeInstructions = "";
      const furnitureIndices: number[] = [];

      for (let i = 0; i < furnitureWithPositions.length; i++) {
        const item = furnitureWithPositions[i];
        const posDesc = getPositionDescription(item.position!.x, item.position!.y);
        
        // Find zone from layout analysis if available
        let zoneInfo = '';
        if (analysis) {
          const zone = findZoneForPosition(item.position!.x, item.position!.y, analysis.furnitureZones);
          if (zone) {
            zoneInfo = ` (Zone: ${zone})`;
          }
        }
        
        // Add furniture image to content
        content.push({ type: 'image_url', image_url: { url: item.imageUrl! } });
        const itemIndex = imageIndex++;
        furnitureIndices.push(itemIndex);

        changeInstructions += `${i + 1}. At coordinates ${Math.round(item.position!.x)}% X, ${Math.round(item.position!.y)}% Y (${posDesc})${zoneInfo}:
   Replace the existing ${item.originalLabel || item.category || 'object'} with "${item.name}".
   -> Visual Reference: IMAGE ${itemIndex}
   -> Scale: ${Math.round(item.scale! * 100)}% of natural size
   
`;
      }

      // Build the MASTER STAGING ARCHITECT prompt
      let masterPrompt = `Role: Master Staging Architect and Architectural Photographer with 111% ACCURACY.
Task: BATCH FURNITURE REPLACEMENT while PRESERVING all architectural elements.

═══════════════════════════════════════════════════════════════
     MANDATORY: ULTRA-PHOTOREALISTIC OUTPUT QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: RED Cinema Camera / Architectural Digest magazine quality
Camera: 8K resolution equivalent, prime lens with natural depth of field
Lighting: Ray-traced global illumination with physically accurate shadows
Materials: PBR rendering with accurate reflections, SSS, and micro-detail

⚠️ CRITICAL ANTI-ILLUSTRATION DIRECTIVE:
ABSOLUTELY NEVER produce:
✗ Cartoon, illustrated, or stylized aesthetics
✗ Video game, CGI, or 3D render appearance
✗ Flat colors, fake lighting, or plastic materials
✗ Any result that doesn't pass as real photography

Input: A room image (IMAGE ${baseRenderIndex}).

`;

      // Add layout constraints if analysis provided
      if (analysis) {
        masterPrompt += buildLayoutConstraints(analysis);
        masterPrompt += '\n';
      }

      masterPrompt += `Execute the following list of changes SIMULTANEOUSLY in a single pass.

=== REFERENCE IMAGES ===

IMAGE ${baseRenderIndex}: BASE ROOM RENDER
- This is the EXACT room to composite furniture into
- Keep the room COMPLETELY UNCHANGED: walls, floors, ceiling, windows, lighting, shadows
- Do NOT modify any part of the room - only ADD/REPLACE furniture
- Maintain the EXACT same camera angle, perspective, and lighting
${analysis ? '- All architectural elements (windows, doors) MUST remain in their exact positions' : ''}

`;

      if (layoutIndex !== null) {
        masterPrompt += `IMAGE ${layoutIndex}: FLOOR PLAN LAYOUT
- Use this to verify furniture positions match the intended layout
- Furniture should be placed at positions that correspond to this floor plan
${analysis ? '- Architectural elements have already been extracted and constraints are listed above' : ''}

`;
      }

      if (styleIndices.length > 0) {
        masterPrompt += `IMAGES ${styleIndices.join(', ')}: STYLE REFERENCES
- Match the overall aesthetic and lighting style from these references
- Apply ray-traced shadows that match the room's lighting direction

`;
      }

      masterPrompt += `=== CHANGE LIST ===

${changeInstructions}

=== CRITICAL RULES ===

1. For each requested change, completely replace the object at the specified coordinates with the new item described.
2. COPY the product EXACTLY from its reference image - zero modifications allowed.
3. The product shape, silhouette, and proportions must be IDENTICAL to the reference.
4. Colors must match EXACTLY - do not adjust, enhance, or correct.
5. Material textures must be preserved PERFECTLY with visible detail.
6. Maintain perfect perspective, scale, and ray-traced lighting consistency.
7. Do NOT modify any parts of the room NOT listed in the Change List.
8. Ensure PHOTOREALISTIC quality with accurate shadows for each placed item.
${analysis ? '9. NEVER alter any architectural elements - windows, doors, walls must remain EXACTLY as in the base render.' : ''}

VISUAL IDENTITY TO PRESERVE:
- If a product has a unique shape → KEEP THAT EXACT SHAPE
- If a product has specific colors → KEEP THOSE EXACT COLORS
- If a product has visible textures → REPLICATE with visible material detail
- If a product has design details → INCLUDE ALL DETAILS

The staged products should look like they were photographed in this room with a RED Cinema Camera.

`;

      if (userPrompt && userPrompt.trim()) {
        masterPrompt += `Additional instructions: ${userPrompt}\n\n`;
      }

      masterPrompt += `=== OUTPUT REQUIREMENTS ===

1. ULTRA-PHOTOREALISTIC quality - RED Cinema Camera / Architectural Digest standard
2. The output must be the BASE RENDER (IMAGE ${baseRenderIndex}) with furniture replaced/added
3. Room must be UNCHANGED - only modify furniture at specified coordinates
4. Furniture must be PIXEL-PERFECT copies of reference images
5. Maintain 16:9 LANDSCAPE aspect ratio
6. Apply ray-traced shadows with realistic contact shadows
7. Materials must look physically accurate with visible texture detail
${analysis ? '8. VERIFY: All architectural elements (windows, doors) remain exactly as in the original' : ''}

⛔ QUALITY REJECTION CRITERIA:
- Output looks like illustration, cartoon, or CGI
- Materials appear plastic, fake, or computer-generated
- Flat colors or unrealistic lighting
- Cannot pass as real architectural photography

✅ QUALITY ACCEPTANCE CRITERIA:
- Indistinguishable from professional photography
- Materials look physically accurate and tangible
- Realistic lighting with natural shadows

Output: ONLY the final ultra-photorealistic image.`;

      content.push({ type: 'text', text: masterPrompt });

      console.log('Master Staging prompt length:', masterPrompt.length);
      console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);

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
        throw new Error('No image generated from Master Staging request');
      }

      console.log('Furniture staged successfully (Master Staging Architect mode)');

      return new Response(JSON.stringify({ imageUrl, mode: 'master-staging' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Standard edit mode (category-based replacement)
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    let imageIndex = 1;

    let currentRenderIndex: number;
    let layoutIndex: number | null = null;
    const styleIndices: number[] = [];
    const furnitureImageIndices: { name: string; category: string; index: number }[] = [];
    
    // Add the current render as the base image (IMAGE 1)
    content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
    currentRenderIndex = imageIndex++;

    // Add layout reference if provided
    if (layoutImageUrl) {
      content.push({ type: 'image_url', image_url: { url: layoutImageUrl } });
      layoutIndex = imageIndex++;
    }

    // Add style references
    if (styleRefUrls && styleRefUrls.length > 0) {
      for (const styleUrl of styleRefUrls) {
        content.push({ type: 'image_url', image_url: { url: styleUrl } });
        styleIndices.push(imageIndex++);
      }
    }

    // Add each furniture item image
    const furnitureWithImages = (furnitureItems as FurnitureItem[] || []).filter(item => item.imageUrl);
    for (const item of furnitureWithImages) {
      if (item.imageUrl) {
        content.push({ type: 'image_url', image_url: { url: item.imageUrl } });
        furnitureImageIndices.push({ 
          name: item.name, 
          category: item.category,
          index: imageIndex++ 
        });
      }
    }

    // Build the editing instruction prompt with numbered change list
    let editInstruction = `Role: Master Staging Architect and Architectural Photographer with 111% ACCURACY.
Task: FURNITURE REPLACEMENT while PRESERVING all architectural elements.

═══════════════════════════════════════════════════════════════
     MANDATORY: ULTRA-PHOTOREALISTIC OUTPUT QUALITY
═══════════════════════════════════════════════════════════════

RENDERING STYLE: RED Cinema Camera / Architectural Digest magazine quality
⚠️ NEVER produce cartoon, illustrated, CGI, or video game aesthetics
Output MUST be indistinguishable from professional architectural photography

Input: A room image (IMAGE ${currentRenderIndex}).

`;

    // Add layout constraints if analysis provided
    if (analysis) {
      editInstruction += buildLayoutConstraints(analysis);
      editInstruction += '\n';
    }

    editInstruction += `=== REFERENCE IMAGES ===

IMAGE ${currentRenderIndex}: This is the CURRENT ROOM RENDER to edit.
- This is your base image - modify it according to the instructions below
- Keep the room architecture, walls, floors, windows, and lighting UNCHANGED
- Maintain the same camera angle and perspective
${analysis ? '- All architectural elements MUST remain exactly as shown' : ''}

`;

    if (layoutIndex !== null) {
      editInstruction += `IMAGE ${layoutIndex}: This is the 2D FLOOR PLAN LAYOUT reference.
- When placing furniture, positions MUST match this layout
- Do NOT move furniture to positions that contradict this floor plan
- Use this to verify correct spatial placement
${analysis ? '- Architectural constraints have been extracted above - follow them precisely' : ''}

`;
    }

    if (styleIndices.length > 0) {
      const styleRange = styleIndices.length === 1 
        ? `IMAGE ${styleIndices[0]}` 
        : `IMAGES ${styleIndices[0]}-${styleIndices[styleIndices.length - 1]}`;
      
      editInstruction += `${styleRange}: These are STYLE REFERENCES.
- The edited render must maintain the aesthetic from these style references
- Match the color palette, materials, and mood

`;
    }

    // Build numbered change list for furniture
    if (furnitureImageIndices.length > 0) {
      editInstruction += `=== CHANGE LIST ===

`;
      
      for (let i = 0; i < furnitureImageIndices.length; i++) {
        const { name, category, index } = furnitureImageIndices[i];
        const categoryTarget = getCategoryReplacementInstruction(category);
        
        // Find matching zone from layout analysis
        let zoneInstruction = '';
        if (analysis) {
          const matchingZone = analysis.furnitureZones.find(z => 
            z.suggestedItems.some(item => 
              item.toLowerCase().includes(category.toLowerCase()) ||
              category.toLowerCase().includes(item.toLowerCase())
            )
          );
          if (matchingZone) {
            zoneInstruction = `\n   -> PLACEMENT ZONE: ${matchingZone.label} (X: ${matchingZone.xStart}-${matchingZone.xEnd}%, Y: ${matchingZone.yStart}-${matchingZone.yEnd}%)`;
          }
        }
        
        editInstruction += `${i + 1}. Find any ${categoryTarget} in the room (IMAGE ${currentRenderIndex}) and REPLACE it with "${name}".
   -> Visual Reference: IMAGE ${index}
   -> COPY this product EXACTLY as shown - zero modifications allowed
   -> The product shape, colors, and textures must be IDENTICAL to IMAGE ${index}${zoneInstruction}
   ${layoutIndex !== null ? `-> Place according to floor plan in IMAGE ${layoutIndex}` : ''}

`;
      }
      
      editInstruction += `=== CRITICAL RULES ===

1. For each item in the Change List, completely replace the matching furniture with the new product.
2. COPY products EXACTLY from reference images - zero modifications allowed.
3. Shape, silhouette, proportions, colors, and textures must be IDENTICAL.
4. Do NOT "improve", "adapt", or "harmonize" products.
5. Maintain perfect perspective, scale, and lighting consistency.
6. The staged products should look like they were CUT from their references and PASTED into the room.
${analysis ? '7. NEVER alter any architectural elements - windows, doors, walls must remain EXACTLY as in the base render.' : ''}

`;
    }

    if (userPrompt && userPrompt.trim()) {
      editInstruction += `Additional instructions: ${userPrompt}\n\n`;
    }

    editInstruction += `=== OUTPUT REQUIREMENTS ===

1. ULTRA-PHOTOREALISTIC quality - RED Cinema Camera / Architectural Digest standard
2. Maintain 16:9 LANDSCAPE aspect ratio
3. Products MUST appear IDENTICALLY to their reference images
4. Apply ray-traced lighting and realistic shadows to placed products
5. Materials must look physically accurate with visible texture detail
6. Room architecture must remain completely unchanged
${analysis ? '7. VERIFY: All windows, doors, and architectural features remain in exact positions' : ''}

⛔ QUALITY REJECTION CRITERIA:
- Output looks like illustration, cartoon, or CGI
- Materials appear plastic or computer-generated
- Cannot pass as real photography

✅ QUALITY ACCEPTANCE CRITERIA:
- Indistinguishable from professional architectural photography
- Materials look physically accurate and tangible
${analysis ? 'The render will be validated against architectural constraints.\n' : ''}
Output: ONLY the final ultra-photorealistic image.`;

    content.push({ type: 'text', text: editInstruction });

    console.log('Edit instruction length:', editInstruction.length);
    console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);

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
