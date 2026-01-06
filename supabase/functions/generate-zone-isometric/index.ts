import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FurnitureSpec {
  type: string;
  material: string;
  color: string;
  position: string;
  enabled: boolean;
}

interface FullAnalysis {
  zoneType?: string;
  furniture?: Array<{
    type: string;
    centerX?: number;
    centerY?: number;
    facingDirection?: string;
    estimatedRealSize?: string;
    confidence?: number;
  }>;
  sceneDescription?: string;
  spatialRelationships?: string[];
  architecturalFeatures?: string[];
  suggestedStyle?: string;
}

interface ZoneConfig {
  name: string;
  zoneType: string;
  customZoneType?: string;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
  ceilingType: string;
  floorType: string;
  wallColor: string;
  windowCount: number;
  doorCount: number;
  naturalLight: 'low' | 'medium' | 'high';
  furniture: FurnitureSpec[];
  styleRefUrl?: string;
  guideUrl?: string;
  additionalPrompt: string;
  croppedImageDataUrl: string;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
  fullAnalysis?: FullAnalysis;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: ZoneConfig = await req.json();
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║     GENERATE ZONE ISOMETRIC - GEMINI 3.0 PRO IMAGE            ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");
    console.log("Zone:", config.name);
    console.log("Type:", config.zoneType);
    console.log("Has full analysis:", !!config.fullAnalysis);
    console.log("Analysis furniture count:", config.fullAnalysis?.furniture?.length || 0);
    console.log("User furniture specs:", config.furniture?.length || 0);
    console.log("Orientation:", config.orientation, "| Aspect ratio:", config.aspectRatio.toFixed(2));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use FULL ANALYSIS if available, otherwise fall back to user specs
    const analysis = config.fullAnalysis;
    const analysisFurniture = analysis?.furniture || [];
    const sceneDescription = analysis?.sceneDescription || '';
    const spatialRelationships = analysis?.spatialRelationships || [];
    const architecturalFeatures = analysis?.architecturalFeatures || [];

    // Build furniture description from ANALYSIS (with exact positions)
    let furnitureDescription: string;
    if (analysisFurniture.length > 0) {
      furnitureDescription = analysisFurniture.map((f, i) => {
        const pos = f.centerX !== undefined && f.centerY !== undefined
          ? `at position (${f.centerX.toFixed(0)}%, ${f.centerY.toFixed(0)}% from top-left of layout)`
          : '';
        const facing = f.facingDirection ? `, facing ${f.facingDirection}` : '';
        const size = f.estimatedRealSize ? `, estimated size: ${f.estimatedRealSize}` : '';
        return `${i + 1}. ${f.type} ${pos}${facing}${size}`;
      }).join('\n');
    } else if (config.furniture && config.furniture.length > 0) {
      // Fallback to user specs
      furnitureDescription = config.furniture
        .filter(f => f.enabled)
        .map((f, i) => `${i + 1}. ${f.type}: ${f.material} material, ${f.color} color, positioned ${f.position.toLowerCase()}`)
        .join('\n');
    } else {
      furnitureDescription = 'Analyze the floor plan and place ALL visible furniture exactly as shown';
    }

    // Build the ULTRA-DETAILED prompt using analysis
    const prompt = `CRITICAL TASK: Transform this 2D FLOOR PLAN into a PHOTOREALISTIC ISOMETRIC 3D INTERIOR RENDER.

=== IMPORTANT: ANALYZE THE FLOOR PLAN IMAGE ===
The attached floor plan shows the EXACT layout of furniture. You MUST:
1. Identify EVERY piece of furniture visible in the floor plan
2. Place each item in the EXACT same position as shown
3. Maintain the EXACT spatial relationships between furniture

=== DETECTED SCENE DESCRIPTION ===
${sceneDescription || 'Analyze the floor plan to understand room layout, furniture arrangement, and spatial organization.'}

=== FURNITURE FROM FLOOR PLAN (MUST INCLUDE ALL) ===
${furnitureDescription}

=== SPATIAL RELATIONSHIPS (MAINTAIN EXACTLY) ===
${spatialRelationships.length > 0 ? spatialRelationships.join('\n') : 'Preserve all relative positions exactly as shown in the floor plan.'}

=== ARCHITECTURAL FEATURES ===
${architecturalFeatures.length > 0 ? architecturalFeatures.join('\n') : `- ${config.ceilingType} ceiling\n- ${config.floorType} flooring\n- ${config.wallColor} walls\n- ${config.windowCount} windows\n- ${config.doorCount} doors`}

=== RENDERING SPECIFICATIONS ===

CAMERA VIEW:
- ISOMETRIC perspective (30-degree elevated corner view)
- Camera positioned to show the ENTIRE room
- All furniture must be clearly visible

ROOM DETAILS:
- Room Type: ${config.customZoneType || config.zoneType}
- Dimensions: ${config.dimensions.width}ft × ${config.dimensions.length}ft × ${config.dimensions.height}ft ceiling
- Floor: ${config.floorType} with realistic wood grain/texture
- Walls: ${config.wallColor} with subtle texture
- Ceiling: ${config.ceilingType}
- Lighting: ${config.naturalLight === 'high' ? 'Bright, sun-filled with strong natural light' : config.naturalLight === 'medium' ? 'Balanced natural and ambient lighting' : 'Soft, moody ambient lighting'}

QUALITY REQUIREMENTS:
- PHOTOREALISTIC rendering quality
- High detail on ALL furniture textures
- Realistic material representation (fabric weave, wood grain, metal reflections)
- Professional interior photography lighting
- Soft realistic shadows

ASPECT RATIO: ${config.orientation} (${config.aspectRatio.toFixed(2)})

${config.additionalPrompt ? `\nADDITIONAL REQUIREMENTS: ${config.additionalPrompt}` : ''}

=== ABSOLUTE RULES ===
1. DO NOT add furniture that is NOT in the floor plan
2. DO NOT remove or reposition ANY furniture
3. COPY the exact layout from the floor plan image
4. Every piece shown in the floor plan MUST appear in the render
5. Maintain exact relative positions and orientations`;

    console.log("Prompt length:", prompt.length, "characters");
    console.log("Prompt preview:", prompt.substring(0, 800) + "...");

    // Prepare the API request with floor plan as PRIMARY image
    const messages: any[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: config.croppedImageDataUrl
            }
          }
        ]
      }
    ];

    // Add style reference if provided
    if (config.styleRefUrl) {
      messages[0].content.push({
        type: "text",
        text: "\n\nSTYLE REFERENCE IMAGE: Match the interior design style, color palette, materials, and mood from this reference while keeping the EXACT furniture layout from the floor plan above."
      });
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: config.styleRefUrl
        }
      });
    }

    // Add guide reference if provided
    if (config.guideUrl) {
      messages[0].content.push({
        type: "text",
        text: "\n\nDESIGN GUIDE: Follow the design principles from this guide image."
      });
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: config.guideUrl
        }
      });
    }

    console.log("Image URL type:", config.croppedImageDataUrl?.startsWith('http') ? 'URL' : 'base64');
    console.log("Starting image generation with model fallback...");

    // Try models in order - fallback if first fails
    const models = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-2.5-flash-image-preview"
    ];
    
    let lastError: Error | null = null;
    let imageUrl: string | null = null;
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${model} error:`, response.status, errorText);
          
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a moment.");
          }
          if (response.status === 402) {
            throw new Error("API credits exhausted. Please add funds to continue.");
          }
          
          lastError = new Error(`${model} failed: ${response.status}`);
          continue; // Try next model
        }

        const data = await response.json();
        console.log(`Model ${model} response received`);

        // Extract the generated image
        imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          console.log(`Success with model: ${model}`);
          break; // Success!
        } else {
          console.log(`No image from ${model}, response:`, JSON.stringify(data).substring(0, 300));
          lastError = new Error(`${model} returned no image`);
        }
      } catch (err) {
        console.error(`Model ${model} threw error:`, err);
        if (err instanceof Error && (err.message.includes("Rate limit") || err.message.includes("API credits"))) {
          throw err; // Don't retry on rate limit or credit issues
        }
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
    
    if (!imageUrl) {
      throw lastError || new Error("All models failed to generate image");
    }

    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║              ISOMETRIC GENERATION SUCCESSFUL                   ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");
    console.log("Image URL length:", imageUrl.length);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        config: {
          name: config.name,
          zoneType: config.zoneType,
          dimensions: config.dimensions,
          furnitureFromAnalysis: analysisFurniture.length,
          furnitureFromUser: config.furniture?.length || 0,
          orientation: config.orientation,
        },
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate zone isometric error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
