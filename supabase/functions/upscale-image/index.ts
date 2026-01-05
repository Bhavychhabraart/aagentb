import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== Upscale Image Function Invoked ===");
  
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageUrl, renderId } = body;
    
    console.log("Request received:", {
      hasImageUrl: !!imageUrl,
      imageUrlType: imageUrl ? (imageUrl.startsWith('data:') ? 'base64' : 'http') : 'none',
      imageUrlLength: imageUrl?.length || 0,
      renderId: renderId || 'none'
    });
    
    if (!imageUrl) {
      console.error("Error: No image URL provided");
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image URL format
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image')) {
      console.error("Error: Invalid image URL format - must be HTTP URL or base64 data URL");
      return new Response(
        JSON.stringify({ error: "Invalid image URL format. Must be HTTP URL or base64 data URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("Error: LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    console.log("LOVABLE_API_KEY is configured");

    // Prepare image content - for HTTP URLs, we can pass directly
    // For very long base64 strings, truncate for logging only
    const logUrl = imageUrl.length > 200 ? `${imageUrl.substring(0, 200)}...` : imageUrl;
    console.log("Sending image to AI gateway:", logUrl);

    // Use Lovable AI to upscale the image to 2K resolution
    // Using gemini-3-pro-image-preview for better image editing/upscaling quality
    console.log("Calling AI gateway for 2K upscaling...");
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
                text: `UPSCALE this image to 2K resolution (2560x1440 or higher).

CRITICAL REQUIREMENTS:
- Output resolution: Minimum 2560x1440 pixels (2K/WQHD)
- Enhance fine details: textures, materials, edges, fabric weaves
- Improve sharpness and clarity significantly
- Preserve EXACT composition, colors, lighting, and style
- NO changes to content, design, or artistic elements
- Professional print-ready quality with high DPI
- Maintain aspect ratio of original image

This is a HIGH-RESOLUTION UPSCALE. The output MUST be dramatically larger and more detailed than the input.
Focus on: sharp edges, crisp textures, enhanced material details, and photorealistic quality.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"],
        generationConfig: { 
          aspectRatio: "16:9"
        }
      }),
    });

    console.log("AI gateway response status:", response.status);

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
          JSON.stringify({ error: "Payment required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response received, checking for images...");
    console.log("Response structure:", {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasMessage: !!data.choices?.[0]?.message,
      hasImages: !!data.choices?.[0]?.message?.images,
      imagesLength: data.choices?.[0]?.message?.images?.length || 0,
      messageContent: data.choices?.[0]?.message?.content?.substring(0, 100) || 'none'
    });

    const upscaledImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!upscaledImageUrl) {
      console.error("No upscaled image in response. Full response:", JSON.stringify(data, null, 2));
      throw new Error("No upscaled image returned from AI. The model may not support image generation for this input.");
    }

    console.log("Upscaled image received, length:", upscaledImageUrl.length);

    // Upload the upscaled image to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Converting base64 to binary...");
    
    // Handle both data URLs and raw base64
    let base64Data = upscaledImageUrl;
    if (upscaledImageUrl.startsWith('data:')) {
      base64Data = upscaledImageUrl.replace(/^data:image\/\w+;base64,/, "");
    }
    
    let binaryData: Uint8Array;
    try {
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log("Binary data size:", binaryData.length, "bytes");
    } catch (e) {
      console.error("Failed to decode base64:", e);
      throw new Error("Failed to decode upscaled image data");
    }
    
    const fileName = `upscaled-${renderId || Date.now()}.png`;
    const filePath = `upscaled/${fileName}`;

    console.log("Uploading to storage:", filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("renders")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload upscaled image: ${uploadError.message}`);
    }

    console.log("Upload successful:", uploadData);

    const { data: publicUrl } = supabase.storage
      .from("renders")
      .getPublicUrl(filePath);

    console.log("=== Upscale Complete ===");
    console.log("Public URL:", publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        upscaledUrl: publicUrl.publicUrl,
        resolution: '2K (2560x1440+)'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("=== Upscale Error ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : 'N/A');
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to upscale image",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
