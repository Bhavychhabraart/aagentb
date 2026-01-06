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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: ZoneConfig = await req.json();
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║           GENERATE ZONE ISOMETRIC - ULTRA ACCURATE            ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");
    console.log("Zone:", config.name);
    console.log("Type:", config.zoneType);
    console.log("Dimensions:", `${config.dimensions.width}ft x ${config.dimensions.length}ft x ${config.dimensions.height}ft`);
    console.log("Furniture count:", config.furniture.length);
    console.log("Orientation:", config.orientation, "| Aspect ratio:", config.aspectRatio.toFixed(2));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the ultra-detailed furniture description
    const furnitureDescription = config.furniture
      .filter(f => f.enabled)
      .map((f, i) => `${i + 1}. ${f.type}: ${f.material} material, ${f.color} color, positioned ${f.position.toLowerCase()}`)
      .join('\n');

    // Determine aspect ratio instruction based on orientation
    const orientationInstruction = config.orientation === 'landscape' 
      ? 'LANDSCAPE orientation (wider than tall) - the room should extend horizontally'
      : config.orientation === 'portrait'
        ? 'PORTRAIT orientation (taller than wide) - the room should extend vertically'
        : 'SQUARE orientation (equal width and height)';

    // Map aspect ratio to common ratios for generation
    let targetAspectRatio: string;
    if (config.aspectRatio >= 2.0) {
      targetAspectRatio = '21:9';
    } else if (config.aspectRatio >= 1.5) {
      targetAspectRatio = '16:9';
    } else if (config.aspectRatio >= 1.2) {
      targetAspectRatio = '4:3';
    } else if (config.aspectRatio >= 0.85) {
      targetAspectRatio = '1:1';
    } else if (config.aspectRatio >= 0.65) {
      targetAspectRatio = '3:4';
    } else {
      targetAspectRatio = '9:16';
    }

    // Calculate dimensions for generation
    const baseSize = 1024;
    let width: number, height: number;
    if (config.orientation === 'landscape') {
      width = baseSize;
      height = Math.round(baseSize / config.aspectRatio);
    } else if (config.orientation === 'portrait') {
      height = baseSize;
      width = Math.round(baseSize * config.aspectRatio);
    } else {
      width = baseSize;
      height = baseSize;
    }
    // Ensure dimensions are multiples of 32 and within limits
    width = Math.max(512, Math.min(1920, Math.round(width / 32) * 32));
    height = Math.max(512, Math.min(1920, Math.round(height / 32) * 32));

    console.log("Target dimensions:", width, "x", height);

    // Build the ultra-detailed prompt
    const prompt = `Generate a PHOTOREALISTIC ISOMETRIC 3D INTERIOR VIEW of this room.

=== ROOM SPECIFICATIONS (MUST FOLLOW EXACTLY) ===

ROOM TYPE: ${config.customZoneType || config.zoneType}
ROOM NAME: ${config.name}

DIMENSIONS (Real-world scale):
- Width: ${config.dimensions.width} feet
- Length: ${config.dimensions.length} feet
- Ceiling Height: ${config.dimensions.height} feet

ARCHITECTURAL DETAILS:
- Ceiling Type: ${config.ceilingType}
- Floor: ${config.floorType} flooring
- Wall Color: ${config.wallColor}
- Windows: ${config.windowCount} window(s) ${config.windowCount > 0 ? '(with natural light coming through)' : ''}
- Doors: ${config.doorCount} door(s)
- Natural Light Level: ${config.naturalLight.toUpperCase()}

=== FURNITURE (PLACE EXACTLY AS SPECIFIED) ===
${furnitureDescription || 'No furniture specified - show empty room'}

=== RENDERING REQUIREMENTS ===

CAMERA:
- ISOMETRIC view angle (30-degree elevated corner view)
- Show the entire room from corner to corner
- Camera positioned to capture all furniture clearly

ASPECT RATIO: ${orientationInstruction}
- The output image MUST be ${targetAspectRatio}
- DO NOT add L-shaped extensions or corner rooms
- Render a simple rectangular room matching the specified dimensions

LIGHTING:
- ${config.naturalLight === 'high' ? 'Bright, sun-filled room with strong natural light from windows' : config.naturalLight === 'medium' ? 'Balanced natural and artificial lighting' : 'Soft, ambient lighting with minimal natural light'}
- Realistic shadows and reflections

QUALITY:
- Photorealistic rendering
- High detail on furniture textures and materials
- Accurate material representation (wood grain, fabric texture, etc.)
- Professional interior photography style

${config.additionalPrompt ? `\nADDITIONAL REQUIREMENTS:\n${config.additionalPrompt}` : ''}

=== CRITICAL CONSTRAINTS ===
1. DO NOT add any furniture not listed above
2. DO NOT change the room shape or add extensions
3. MATCH the exact aspect ratio: ${targetAspectRatio}
4. Use ONLY the materials and colors specified
5. Position furniture EXACTLY as described`;

    console.log("Prompt length:", prompt.length, "characters");

    // Prepare the API request
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
        type: "image_url",
        image_url: {
          url: config.styleRefUrl
        }
      });
      messages[0].content[0].text += "\n\nSTYLE REFERENCE: Match the interior design style, color palette, and mood shown in the attached style reference image.";
    }

    // Add guide reference if provided
    if (config.guideUrl) {
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: config.guideUrl
        }
      });
      messages[0].content[0].text += "\n\nDESIGN GUIDE: Follow the furniture arrangement patterns and design principles shown in the attached guide image.";
    }

    console.log("Calling Lovable AI (Gemini 2.5 Flash Image) for generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("API credits exhausted. Please add funds to continue.");
      }
      
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Lovable AI response received");

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated in response");
    }

    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                    GENERATION SUCCESSFUL                       ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        config: {
          name: config.name,
          zoneType: config.zoneType,
          dimensions: config.dimensions,
          furnitureCount: config.furniture.filter(f => f.enabled).length,
          orientation: config.orientation,
          aspectRatio: targetAspectRatio,
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
