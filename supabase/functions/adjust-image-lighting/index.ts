import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdjustmentRequest {
  sourceImageUrl: string;
  brightness: number;
  contrast: number;
  saturation: number;
  shadowIntensity: 'soft' | 'medium' | 'dramatic';
  lightingStyle: 'studio' | 'natural' | 'dramatic' | 'moody' | 'backlit';
  productName?: string;
}

const lightingPrompts: Record<string, string> = {
  studio: "Professional studio lighting with even, soft illumination from multiple angles. Clean, commercial product photography lighting.",
  natural: "Natural daylight lighting, soft and warm with gentle window light effect. Organic, inviting atmosphere.",
  dramatic: "High contrast dramatic lighting with strong directional light source creating bold highlights and deep shadows.",
  moody: "Low-key moody lighting with dark, rich tones and subtle highlights. Sophisticated, atmospheric feel.",
  backlit: "Backlit with rim lighting creating a glowing halo effect around the product. Ethereal, premium feel."
};

const shadowPrompts: Record<string, string> = {
  soft: "Very soft, barely visible shadows for a clean, floating, e-commerce look",
  medium: "Natural medium shadows providing depth and dimension while maintaining clarity",
  dramatic: "Strong, dramatic shadows for visual impact and artistic expression"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: AdjustmentRequest = await req.json();
    const { 
      sourceImageUrl, 
      brightness, 
      contrast, 
      saturation, 
      shadowIntensity, 
      lightingStyle,
      productName 
    } = body;

    if (!sourceImageUrl) {
      throw new Error("Source image URL is required");
    }

    console.log('Adjusting image lighting:', { 
      brightness, contrast, saturation, shadowIntensity, lightingStyle, productName 
    });

    // Build adjustment description
    const adjustmentParts: string[] = [];
    
    if (brightness !== 100) {
      adjustmentParts.push(brightness > 100 ? `brighter (+${brightness - 100}%)` : `darker (${brightness - 100}%)`);
    }
    if (contrast !== 100) {
      adjustmentParts.push(contrast > 100 ? `higher contrast (+${contrast - 100}%)` : `lower contrast (${contrast - 100}%)`);
    }
    if (saturation !== 100) {
      adjustmentParts.push(saturation > 100 ? `more saturated (+${saturation - 100}%)` : `less saturated (${saturation - 100}%)`);
    }

    const lightingDesc = lightingPrompts[lightingStyle] || lightingPrompts.studio;
    const shadowDesc = shadowPrompts[shadowIntensity] || shadowPrompts.medium;

    const editPrompt = `
Adjust this furniture product image with the following modifications:

LIGHTING: ${lightingDesc}
SHADOWS: ${shadowDesc}
${adjustmentParts.length > 0 ? `EXPOSURE ADJUSTMENTS: Make the image ${adjustmentParts.join(', ')}.` : ''}

CRITICAL REQUIREMENTS:
- Keep the EXACT SAME furniture piece, pose, and angle
- Maintain a PURE WHITE BACKGROUND (#FFFFFF) - absolutely no gradients or color variations
- Apply the specified lighting style while keeping the product clearly visible
- Professional e-commerce product photography quality
- 8K quality, sharp details on materials and textures
${productName ? `- This is a ${productName} - preserve all its design details` : ''}

Do NOT change the furniture design, only adjust the lighting and atmosphere.
`.trim();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: editPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: sourceImageUrl,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated in response");
    }

    console.log("Image adjustment complete");

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in adjust-image-lighting:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
