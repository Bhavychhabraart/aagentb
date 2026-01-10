import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANGLE_PROMPTS: Record<string, string> = {
  top: `Show this exact furniture piece from directly above (bird's eye view). 
Maintain the same materials, colors, and design exactly as shown.
Pure white studio background. Professional product photography lighting.
High resolution, sharp details, accurate proportions.`,

  side: `Show this exact furniture piece from a pure side profile (90-degree angle).
Maintain the same materials, colors, and design exactly as shown.
Pure white studio background. Professional product photography lighting.
High resolution, sharp details, accurate proportions.`,

  back: `Show this exact furniture piece from the back/rear view.
Maintain the same materials, colors, and design exactly as shown.
Pure white studio background. Professional product photography lighting.
High resolution, sharp details, accurate proportions.`,

  detailed: `Create a close-up detail shot of this furniture piece.
Focus on material textures, craftsmanship, joints, or unique design elements.
Macro photography style, shallow depth of field for emphasis.
Pure white studio background. Professional product photography.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceImageUrl, angle, customPrompt, productName, category } = await req.json();

    if (!sourceImageUrl) {
      return new Response(
        JSON.stringify({ error: "Source image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!angle) {
      return new Response(
        JSON.stringify({ error: "Angle type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt based on angle type
    let prompt: string;
    if (angle === "custom" && customPrompt) {
      prompt = `${customPrompt}
Based on this ${category || "furniture"} piece${productName ? ` (${productName})` : ""}.
Maintain the same materials, colors, and design exactly as shown.
Pure white studio background. Professional product photography.`;
    } else {
      prompt = ANGLE_PROMPTS[angle] || ANGLE_PROMPTS.side;
      if (productName) {
        prompt = `${productName}: ${prompt}`;
      }
    }

    console.log(`Generating ${angle} view for product: ${productName || 'Unknown'}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    // Call Lovable AI with image editing capability
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
                text: prompt,
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
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error("No image generated from AI response");
    }

    console.log(`Successfully generated ${angle} view`);

    return new Response(
      JSON.stringify({ 
        imageUrl: generatedImageUrl,
        angle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating product angle:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
