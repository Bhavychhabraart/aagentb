import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROOM_PROMPTS: Record<string, string> = {
  "living-room": "Modern living room with comfortable sofa, warm ambient lighting, large windows with natural light, contemporary decor, neutral warm color palette, high-end residential interior design",
  "bedroom": "Cozy master bedroom with soft bedding, warm bedside lighting, calming neutral tones, peaceful atmosphere, contemporary bedroom design",
  "dining-room": "Elegant dining room with a beautiful dining table setting, pendant lighting, natural daylight, sophisticated modern decor, entertaining-ready atmosphere",
  "office": "Professional home office with clean desk setup, natural lighting from window, modern minimalist decor, productive work environment, contemporary home workspace",
  "outdoor": "Beautiful outdoor patio or terrace with greenery, natural sunlight, comfortable outdoor living space, garden views, relaxing atmosphere",
  "kitchen": "Modern kitchen interior with marble countertops, natural light, contemporary fixtures, clean minimalist design, warm welcoming atmosphere",
  "entryway": "Stylish entryway or foyer, welcoming atmosphere, natural light, contemporary decor, inviting entrance design",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productImageUrl, productName, roomType } = await req.json();

    if (!productImageUrl) {
      throw new Error("Missing product image URL");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const room = roomType || "living-room";
    const roomDescription = ROOM_PROMPTS[room] || ROOM_PROMPTS["living-room"];

    const prompt = `Professional interior design photography showing this furniture piece naturally placed in a room.

Room Setting: ${roomDescription}

Product: ${productName || "Furniture piece"}

Requirements:
- Place the furniture naturally and realistically in the room setting
- The furniture should be the focal point of the image
- Use professional interior photography lighting
- Create a photorealistic, magazine-quality interior shot
- The furniture must match exactly what is shown in the reference image
- 16:10 aspect ratio suitable for product showcase
- High-end residential interior design aesthetic

Ultra high resolution interior photography.`;

    console.log("Generating realspace image for:", productName, "in", room);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
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
                  url: productImageUrl,
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
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ imageUrl, roomType: room }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-realspace-image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
