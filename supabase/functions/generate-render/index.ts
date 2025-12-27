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

interface LayoutAnalysis {
  roomShape: string;
  dimensions: { width: number; depth: number; height: number; unit: string };
  aspectRatio: string;
  walls: { position: string; length: number; features: { type: string; positionPercent: number; widthPercent: number }[] }[];
  windows: { wall: string; positionPercent: number; widthPercent: number; heightPercent: number; type: string }[];
  doors: { wall: string; positionPercent: number; widthPercent: number; type: string; swingDirection: string }[];
  furnitureZones: { name: string; label: string; xStart: number; xEnd: number; yStart: number; yEnd: number; suggestedItems: string[] }[];
  cameraRecommendation: { position: string; angle: number; height: string; fov: string };
  gridOverlay: string;
}

// Build architectural specification from layout analysis
function buildArchitecturalSpec(analysis: LayoutAnalysis): string {
  const { dimensions, walls, windows, doors, furnitureZones, cameraRecommendation, gridOverlay } = analysis;
  
  let spec = `MANDATORY ARCHITECTURAL CONSTRAINTS:

═══════════════════════════════════════════════════════════════
                    ROOM GEOMETRY SPECIFICATION
═══════════════════════════════════════════════════════════════

ROOM SHAPE: ${analysis.roomShape.toUpperCase()}
DIMENSIONS: ${dimensions.width}${dimensions.unit === 'feet' ? 'ft' : 'm'} wide × ${dimensions.depth}${dimensions.unit === 'feet' ? 'ft' : 'm'} deep × ${dimensions.height}${dimensions.unit === 'feet' ? 'ft' : 'm'} ceiling
ASPECT RATIO: ${analysis.aspectRatio}

`;

  // Wall specifications
  spec += `═══════════════════════════════════════════════════════════════
                    WALL SPECIFICATIONS (Top = North)
═══════════════════════════════════════════════════════════════

`;

  // ASCII representation of room
  spec += `┌─────────────────NORTH (${dimensions.width}ft)─────────────────┐
│`;
  
  // Add window markers for north wall
  const northWin = windows.filter(w => w.wall === 'north');
  if (northWin.length > 0) {
    northWin.forEach(w => {
      spec += ` ▢ Window @${Math.round(w.positionPercent)}%`;
    });
  } else {
    spec += '                    SOLID                     ';
  }
  spec += `│
│                                                           │
│WEST                                                   EAST│
│(${dimensions.depth}ft)                                                (${dimensions.depth}ft)│
│                                                           │
│`;

  // Add window markers for south wall
  const southWin = windows.filter(w => w.wall === 'south');
  if (southWin.length > 0) {
    southWin.forEach(w => {
      spec += ` ▢ Window @${Math.round(w.positionPercent)}%`;
    });
  } else {
    const southDoor = doors.filter(d => d.wall === 'south');
    if (southDoor.length > 0) {
      southDoor.forEach(d => {
        spec += ` ◯ Door @${Math.round(d.positionPercent)}%`;
      });
    } else {
      spec += '                    SOLID                     ';
    }
  }
  spec += `│
└─────────────────SOUTH (${dimensions.width}ft)─────────────────┘

`;

  // Detailed wall features
  for (const wall of walls) {
    const wallWindows = windows.filter(w => w.wall === wall.position);
    const wallDoors = doors.filter(d => d.wall === wall.position);
    
    spec += `${wall.position.toUpperCase()} WALL (${wall.length}ft):\n`;
    
    if (wallWindows.length > 0) {
      wallWindows.forEach((w, i) => {
        spec += `  → Window ${i + 1}: Position ${Math.round(w.positionPercent)}% from left, Width ${Math.round(w.widthPercent)}%, Type: ${w.type}\n`;
      });
    }
    if (wallDoors.length > 0) {
      wallDoors.forEach((d, i) => {
        spec += `  → Door ${i + 1}: Position ${Math.round(d.positionPercent)}% from left, Type: ${d.type}, Swing: ${d.swingDirection}\n`;
      });
    }
    if (wallWindows.length === 0 && wallDoors.length === 0) {
      spec += `  → SOLID WALL (no openings)\n`;
    }
    spec += '\n';
  }

  // Camera specification - FORCE ISOMETRIC VIEW for initial renders
  spec += `═══════════════════════════════════════════════════════════════
                    CAMERA POSITION & ANGLE (ISOMETRIC - MANDATORY)
═══════════════════════════════════════════════════════════════

⚠️ MANDATORY ISOMETRIC CAMERA VIEW - DO NOT DEVIATE ⚠️

CAMERA TYPE: ISOMETRIC (45° elevated corner view)
CAMERA HEIGHT: 8-10ft equivalent (elevated, looking down at ~45°)
VIEWING FROM: Southeast corner (elevated position)
LOOKING TOWARD: Northwest (center of room)
FIELD OF VIEW: Wide (capture entire room)
PERSPECTIVE: Near-orthographic (minimal distortion, parallel lines stay parallel)

ISOMETRIC VIEW REQUIREMENTS:
1. Camera elevated at 45° above ground plane
2. Corner view showing THREE surfaces: floor + two adjacent walls
3. Looking diagonally into the room from elevated corner
4. All vertical lines remain vertical (no extreme perspective)
5. Full room visibility - entire room in frame

Visual Reference (Isometric Corner View):
     ╱‾‾‾‾‾‾‾‾╲
    ╱   CEILING  ╲
   ╱______________╲
   ╲      |      ╱
    ╲ WALL | WALL╱
     ╲____|____╱
         FLOOR

DO NOT render from:
✗ Eye-level perspective (too flat, no room overview)
✗ Bird's-eye/top-down view (no wall visibility)
✗ Front-facing flat view (no depth perception)

`;

  // Furniture zones
  if (furnitureZones.length > 0) {
    spec += `═══════════════════════════════════════════════════════════════
                    FURNITURE PLACEMENT ZONES
═══════════════════════════════════════════════════════════════

`;
    furnitureZones.forEach((zone, i) => {
      spec += `ZONE ${i + 1}: ${zone.label.toUpperCase()}
  • X Range: ${zone.xStart}% - ${zone.xEnd}% (left to right)
  • Y Range: ${zone.yStart}% - ${zone.yEnd}% (front to back)
  • Suggested: ${zone.suggestedItems.join(', ')}
  
`;
    });
  }

  // Verification checklist
  spec += `═══════════════════════════════════════════════════════════════
                    VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════

The generated render MUST show:
□ Room proportions matching ${dimensions.width}:${dimensions.depth} ratio
□ Total windows visible: ${windows.length} (check each wall)
□ Door(s) visible: ${doors.length} total
□ Camera angle from ${cameraRecommendation.position} corner
□ Furniture placed within designated zones

FAILURE CONDITIONS (will require regeneration):
✗ Wrong number of windows on any wall
✗ Door on wrong wall or missing
✗ Camera angle from incorrect corner
✗ Room proportions don't match specification
✗ Furniture placed outside designated zones

`;

  return spec;
}

function getOppositeCorner(corner: string): string {
  const opposites: Record<string, string> = {
    'southeast': 'northwest',
    'southwest': 'northeast',
    'northeast': 'southwest',
    'northwest': 'southeast',
    'center': 'center'
  };
  return opposites[corner] || 'opposite corner';
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
      styleRefUrls,
      layoutAnalysis // NEW: Pre-parsed layout data
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating render for prompt:', prompt);
    console.log('Furniture items:', furnitureItems?.length || 0);
    console.log('Layout image:', layoutImageUrl ? 'provided' : 'none');
    console.log('Layout analysis:', layoutAnalysis ? 'provided (111% accuracy mode)' : 'none');
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

    // Build structured prompt with ARCHITECTURAL CONSTRAINTS if layout analysis provided
    let structuredPrompt = `Role: Expert Interior Architect and 3D Visualizer with PIXEL-PERFECT architectural accuracy.
Task: Generate a photorealistic interior design render that EXACTLY matches the floor plan specifications.

=== MANDATORY CAMERA POSITION: ISOMETRIC VIEW ===

⚠️ HIGHEST PRIORITY CAMERA DIRECTIVE - DO NOT DEVIATE ⚠️

The render MUST be generated from an ISOMETRIC camera angle:

1. CAMERA HEIGHT: Elevated position - approximately 45° above the ground plane (8-10ft equivalent)
2. CAMERA ANGLE: 30-45° corner view showing THREE surfaces:
   - The floor plane (visible from above)
   - Two adjacent walls (creating the classic isometric "corner" view)
3. VIEWING DIRECTION: Looking diagonally into the room from an elevated corner (southeast to northwest)
4. NO EXTREME PERSPECTIVE: Maintain near-parallel lines (minimal vanishing point distortion)
5. FULL ROOM VISIBILITY: The ENTIRE room must be visible in the frame

Visual Reference (Isometric Corner View):
     ╱‾‾‾‾‾‾‾‾╲
    ╱   CEILING  ╲
   ╱______________╲
   ╲      |      ╱
    ╲ WALL | WALL╱
     ╲____|____╱
         FLOOR

This isometric angle provides:
✓ Clear view of floor layout and furniture placement
✓ Visibility of wall treatments and décor
✓ Professional architectural visualization standard
✓ Best overview for interior design presentation

DO NOT render from:
✗ Eye-level perspective (too flat, missing room overview)
✗ Bird's-eye/top-down view (no wall visibility)
✗ Front-facing flat view (no depth perception)
✗ Low angle view (distorted proportions)

`;

    // Add ARCHITECTURAL CONSTRAINTS if layout analysis is provided
    if (layoutAnalysis) {
      structuredPrompt += buildArchitecturalSpec(layoutAnalysis as LayoutAnalysis);
      structuredPrompt += '\n';
    }

    structuredPrompt += `=== REFERENCE IMAGES ===

`;

    // Layout instructions (highest priority)
    if (layoutImageIndex !== null) {
      structuredPrompt += `IMAGE ${layoutImageIndex}: 2D FLOOR PLAN LAYOUT (HIGHEST PRIORITY)
- The generated room MUST match this layout's room shape, walls, and proportions EXACTLY
- Place furniture in the EXACT positions shown in this floor plan
- Doors, windows, and openings must be in the EXACT locations shown
- The room dimensions and proportions must be pixel-accurate to this layout
- This is the MASTER reference for spatial arrangement
${layoutAnalysis ? '\n⚠️ ARCHITECTURAL CONSTRAINTS ABOVE WERE EXTRACTED FROM THIS LAYOUT - FOLLOW THEM PRECISELY\n' : ''}
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
        
        // Find matching zone from layout analysis if available
        let zoneInstruction = '';
        if (layoutAnalysis) {
          const analysis = layoutAnalysis as LayoutAnalysis;
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
        
        structuredPrompt += `${i + 1}. "${name}" (${category})
   -> Visual Reference: IMAGE ${index}
   -> COPY this product EXACTLY as shown - zero modifications allowed
   -> Shape, silhouette, and proportions must be IDENTICAL to IMAGE ${index}
   -> Colors must match EXACTLY - do not adjust, enhance, or correct
   -> Material textures must be preserved PERFECTLY
   -> Any unique design features must appear IDENTICALLY${zoneInstruction}
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

1. ${layoutAnalysis ? 'ARCHITECTURAL CONSTRAINTS ABOVE ARE MANDATORY - any deviation is a failure' : 'Layout proportions must match the floor plan exactly'}
2. Products MUST appear IDENTICALLY to their reference images - this is the #1 priority
3. COPY products EXACTLY - do NOT "improve", "adapt", or "harmonize" them
4. The staged products should look like they were CUT from their references and PASTED into the room
5. If a product has a unique shape → KEEP THAT EXACT SHAPE
6. If a product has specific colors → KEEP THOSE EXACT COLORS (no white-balancing)
7. If a product has visible textures → REPLICATE THOSE EXACT TEXTURES
8. If a product has design details (buttons, stitching, patterns) → INCLUDE ALL DETAILS

`;

    // Output requirements
    structuredPrompt += `=== OUTPUT REQUIREMENTS ===

1. Photorealistic quality - professional architectural visualization
2. 16:9 LANDSCAPE aspect ratio (wide cinematic format)
3. **ISOMETRIC CAMERA ANGLE** - elevated 45° corner view showing floor + two walls (MANDATORY)
4. Dramatic, realistic lighting with natural shadows
5. High-end interior design aesthetic
6. All reference images must be respected in order of priority: Layout > Style > Room Photo > Furniture
${layoutAnalysis ? '7. VERIFY all architectural constraints are met before finalizing' : ''}

⚠️ QUALITY CHECK: 
After generation, the render will be compared against specifications.
- ISOMETRIC VIEW: Must be 45° elevated corner view (NOT eye-level, NOT top-down)
- Window count and positions will be verified
- Door locations will be checked
- Room proportions will be measured
- Furniture zones will be validated
ANY discrepancies will require regeneration.
The goal is 111% architectural accuracy with ISOMETRIC perspective.

Output: ONLY the final image.`;

    content.push({ type: 'text', text: structuredPrompt });

    console.log('Structured prompt length:', structuredPrompt.length);
    console.log('Total images in request:', content.filter(c => c.type === 'image_url').length);
    console.log('111% accuracy mode:', layoutAnalysis ? 'ENABLED' : 'disabled');

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
