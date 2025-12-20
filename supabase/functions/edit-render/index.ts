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

// Build layout constraints string
function buildLayoutConstraints(analysis: LayoutAnalysis): string {
  return `
LAYOUT CONSTRAINTS (from floor plan analysis):
═══════════════════════════════════════════════════════════════
Room: ${analysis.roomShape} (${analysis.dimensions.width}×${analysis.dimensions.depth}${analysis.dimensions.unit === 'feet' ? 'ft' : 'm'})
Windows: ${analysis.windows.map(w => `${w.wall} wall @${Math.round(w.positionPercent)}%`).join(', ') || 'None visible'}
Doors: ${analysis.doors.map(d => `${d.wall} wall @${Math.round(d.positionPercent)}%`).join(', ') || 'None visible'}

FURNITURE ZONES:
${analysis.furnitureZones.map(z => `• ${z.label}: X(${z.xStart}-${z.xEnd}%) Y(${z.yStart}-${z.yEnd}%)`).join('\n')}

⚠️ CRITICAL: Do NOT move or modify any architectural elements (walls, windows, doors, floors, ceilings)
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
      maskRegion // NEW: For selective area editing { x, y, width, height } as percentages
    } = await req.json();
    
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
    console.log('Mask region:', maskRegion ? `${maskRegion.x}%,${maskRegion.y}% (${maskRegion.width}%×${maskRegion.height}%)` : 'none');

    // Handle SELECTIVE AREA EDIT mode
    if (maskRegion && userPrompt) {
      console.log('Using SELECTIVE AREA EDIT mode');
      
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      content.push({ type: 'image_url', image_url: { url: currentRenderUrl } });
      
      const selectivePrompt = `You are a precise image editor. Edit ONLY the specified region of this room image.

REGION TO EDIT:
- Position: ${Math.round(maskRegion.x)}% from left, ${Math.round(maskRegion.y)}% from top
- Size: ${Math.round(maskRegion.width)}% width × ${Math.round(maskRegion.height)}% height

EDIT INSTRUCTION: ${userPrompt}

CRITICAL RULES:
1. ONLY modify content within the specified region
2. Keep EVERYTHING outside this region EXACTLY unchanged - pixel perfect
3. Maintain consistent lighting, shadows, and perspective with surrounding areas
4. The edit should blend seamlessly with the rest of the image
5. Preserve the same camera angle and image quality

Output: The edited image with ONLY the specified region modified.`;

      content.push({ type: 'text', text: selectivePrompt });

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

      console.log('Selective area edit completed successfully');
      return new Response(JSON.stringify({ imageUrl, mode: 'selective-edit' }), {
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
      let masterPrompt = `Role: Master Staging Architect with 111% ARCHITECTURAL ACCURACY.
Task: BATCH FURNITURE REPLACEMENT while PRESERVING all architectural elements.

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
- Apply realistic shadows that match the room's lighting direction

`;
      }

      masterPrompt += `=== CHANGE LIST ===

${changeInstructions}

=== CRITICAL RULES ===

1. For each requested change, completely replace the object at the specified coordinates with the new item described.
2. COPY the product EXACTLY from its reference image - zero modifications allowed.
3. The product shape, silhouette, and proportions must be IDENTICAL to the reference.
4. Colors must match EXACTLY - do not adjust, enhance, or correct.
5. Material textures must be preserved PERFECTLY.
6. Maintain perfect perspective, scale, and lighting consistency with the rest of the room.
7. Do NOT modify any parts of the room NOT listed in the Change List.
8. Ensure high-end photorealism with realistic shadows for each placed item.
${analysis ? '9. NEVER alter any architectural elements - windows, doors, walls must remain EXACTLY as in the base render.' : ''}

VISUAL IDENTITY TO PRESERVE:
- If a product has a unique shape (curved, angular, organic) → KEEP THAT EXACT SHAPE
- If a product has specific colors → KEEP THOSE EXACT COLORS (no white-balancing)
- If a product has visible textures → REPLICATE THOSE EXACT TEXTURES
- If a product has design details (buttons, stitching, patterns) → INCLUDE ALL DETAILS

The staged products should look like they were CUT from their reference images and PASTED into the room.

`;

      if (userPrompt && userPrompt.trim()) {
        masterPrompt += `Additional instructions: ${userPrompt}\n\n`;
      }

      masterPrompt += `=== OUTPUT REQUIREMENTS ===

1. The output must be the BASE RENDER (IMAGE ${baseRenderIndex}) with furniture replaced/added
2. Room must be UNCHANGED - only modify furniture at specified coordinates
3. Furniture must be PIXEL-PERFECT copies of reference images
4. Maintain 16:9 LANDSCAPE aspect ratio
5. Apply realistic shadows for each placed item
6. Final result should look like a professional furniture staging
${analysis ? '7. VERIFY: All architectural elements (windows, doors) remain exactly as in the original' : ''}

⚠️ QUALITY CHECK: 
After compositing, each furniture item will be compared side-by-side with its reference.
${analysis ? 'The render will also be validated against the architectural constraints.' : ''}
ANY deviation in shape, color, or details is a failure.
The goal is 111% visual and architectural accuracy.

Output: ONLY the final image.`;

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
    let editInstruction = `Role: Master Staging Architect with 111% ARCHITECTURAL ACCURACY.
Task: FURNITURE REPLACEMENT while PRESERVING all architectural elements.

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

1. Photorealistic quality - professional furniture staging
2. Maintain 16:9 LANDSCAPE aspect ratio
3. Products MUST appear IDENTICALLY to their reference images
4. Apply realistic lighting and shadows to placed products
5. Room architecture must remain completely unchanged
${analysis ? '6. VERIFY: All windows, doors, and architectural features remain in exact positions' : ''}

⚠️ QUALITY CHECK:
${analysis ? 'The render will be validated against architectural constraints.\n' : ''}ANY deviation in product appearance or architectural elements is a failure.
The goal is 111% accuracy.

Output: ONLY the final image.`;

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
