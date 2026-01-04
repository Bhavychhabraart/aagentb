import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomImageUrl, clickX, clickY } = await req.json();

    if (!roomImageUrl || clickX === undefined || clickY === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: roomImageUrl, clickX, clickY" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Identifying furniture at click position: ${clickX}%, ${clickY}%`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Identify what furniture is at the click coordinates
    const identifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Look at this room image. At approximately ${clickX}% from the left and ${clickY}% from the top of the image, identify what furniture or object is located there.

Return a JSON response with:
{
  "label": "name of the furniture item (e.g., 'Modern Sofa', 'Coffee Table', 'Floor Lamp')",
  "category": "furniture category (e.g., 'seating', 'table', 'lighting', 'decor')",
  "found": true/false
}

If no clear furniture item is at that location, set found to false.`
              },
              {
                type: "image_url",
                image_url: { url: roomImageUrl }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_furniture",
              description: "Identify the furniture at the specified coordinates",
              parameters: {
                type: "object",
                properties: {
                  label: { type: "string", description: "Name of the furniture item" },
                  category: { type: "string", description: "Category of the furniture" },
                  found: { type: "boolean", description: "Whether furniture was found at location" }
                },
                required: ["label", "category", "found"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "identify_furniture" } }
      }),
    });

    if (!identifyResponse.ok) {
      const errorText = await identifyResponse.text();
      console.error("AI identification error:", errorText);
      throw new Error("Failed to identify furniture");
    }

    const identifyData = await identifyResponse.json();
    console.log("Identify response:", JSON.stringify(identifyData, null, 2));

    const toolCall = identifyData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const identification = JSON.parse(toolCall.function.arguments);
    
    if (!identification.found) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No furniture detected at this location" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Identified: ${identification.label} (${identification.category})`);

    // Step 2: Generate a masked image with the identified furniture highlighted
    const maskResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                text: `Take this room image and create a visual mask overlay highlighting ONLY the "${identification.label}" furniture item that is located at approximately ${clickX}% from the left and ${clickY}% from the top.

Instructions:
1. Keep the entire room image visible
2. Add a semi-transparent purple overlay (color #A855F7 at about 50% opacity) ONLY on the ${identification.label}
3. The purple mask should precisely follow the contours of the ${identification.label}
4. Everything else in the room should remain clearly visible without the purple overlay
5. The result should clearly show which item is selected

Create this masked image now.`
              },
              {
                type: "image_url",
                image_url: { url: roomImageUrl }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!maskResponse.ok) {
      const errorText = await maskResponse.text();
      console.error("AI mask generation error:", errorText);
      
      // Fallback: Return success without mask image
      return new Response(
        JSON.stringify({ 
          success: true,
          label: identification.label,
          category: identification.category,
          maskedImageUrl: roomImageUrl, // Use original as fallback
          clickPosition: { x: clickX, y: clickY }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const maskData = await maskResponse.json();
    console.log("Mask response received");

    const maskedImageUrl = maskData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    return new Response(
      JSON.stringify({ 
        success: true,
        label: identification.label,
        category: identification.category,
        maskedImageUrl: maskedImageUrl || roomImageUrl,
        clickPosition: { x: clickX, y: clickY }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in identify-and-mask:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
