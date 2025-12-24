import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const planTypePrompts: Record<string, string> = {
  "floor-plan": `You are an expert architectural drafter. Analyze this floor plan image and create a professional architectural floor plan drawing. 
Include:
- All walls and partitions with proper line weights
- Room names and dimensions
- Doors with swing direction indicators
- Windows with proper symbols
- Clear circulation paths
- North arrow and scale reference
Create a clean, professional CAD-style drawing.`,

  "rcp": `You are an expert ceiling design specialist. Based on this floor plan, create a Reflected Ceiling Plan (RCP).
Include:
- False ceiling design boundaries
- Light fixture placements (recessed, pendant, track)
- AC diffuser locations
- Fan positions
- Ceiling height annotations
- Ceiling material indicators
- Legend for all symbols
Create a professional RCP drawing viewed from above as if looking up at a mirror.`,

  "electrical": `You are an expert electrical engineer. Based on this floor plan, create an Electrical Plan.
Include:
- Switchboard locations (near room entrances)
- Power socket positions (beds, desks, kitchen counters)
- Light point locations
- AC connection points
- Distribution Board (DB) location
- Circuit routing indicators
- Switch-to-light mapping
- Legend with standard electrical symbols
Create a professional electrical layout drawing.`,

  "plumbing": `You are an expert plumbing engineer. Based on this floor plan, create a Plumbing & Sanitary Plan.
Include:
- Cold water supply lines (blue)
- Hot water lines (red) if applicable
- Drainage/waste pipes
- Floor trap locations
- Sanitary fixtures (WC, basin, shower, kitchen sink)
- Plumbing shaft locations
- Pipe size annotations
- Slope indicators for drainage
- Legend with plumbing symbols
Create a professional plumbing layout drawing.`,

  "furniture": `You are an expert interior designer. Based on this floor plan, create a Furniture Layout Plan.
Include:
- Bed placements with proper clearances
- Sofa and seating arrangements
- Dining table positions
- Wardrobes and storage units
- Kitchen cabinet layout
- Desk and work areas
- Clear circulation paths (dotted lines)
- Furniture dimensions
- Legend with furniture symbols
Create a professional furniture layout drawing.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base_layout_url, plan_type, prompt, user_id } = await req.json();

    if (!base_layout_url || !plan_type) {
      return new Response(
        JSON.stringify({ error: "base_layout_url and plan_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = planTypePrompts[plan_type] || planTypePrompts["floor-plan"];
    const userPrompt = prompt 
      ? `${systemPrompt}\n\nAdditional requirements: ${prompt}` 
      : systemPrompt;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ${plan_type} plan for user ${user_id}`);

    // Use Lovable AI with image generation model
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
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: base_layout_url,
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract generated image
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (generatedImage) {
      return new Response(
        JSON.stringify({
          plan_url: generatedImage,
          plan_type,
          description: textResponse || `Generated ${plan_type} plan`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no image, return text response
    return new Response(
      JSON.stringify({
        plan_url: null,
        plan_type,
        description: textResponse || "Plan analysis complete",
        message: "Image generation not available. Text analysis provided.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-drawing-plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
