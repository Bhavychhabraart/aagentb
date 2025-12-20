import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOLO_PROMPTS: Record<string, string> = {
  "white-studio": "Pure white seamless studio background, professional product photography, soft diffused lighting, subtle shadow beneath product, ultra clean aesthetic, high-end e-commerce style",
  "black-studio": "Dramatic black backdrop, professional rim lighting creating edge highlights, moody and luxurious feel, high contrast product photography",
  "gradient-gray": "Subtle gray gradient background from light to medium gray, professional catalog style photography, even lighting, commercial product shot",
  "natural-wood": "Natural oak wood surface, minimalist styling, warm natural light from side, Scandinavian aesthetic, lifestyle product photography",
  "marble-elegance": "White Carrara marble surface with subtle gray veining, luxury aesthetic, soft natural light, high-end brand photography",
  "floating": "Product floating in mid-air against light gray background, dramatic shadow below suggesting levitation, surreal product photography",
  "colored-backdrop": "Vibrant gradient backdrop transitioning from purple to pink, bold modern aesthetic, fashion-forward product photography",
  "soft-fabric": "Neutral beige linen fabric draped as background, soft organic textures, warm natural lighting, artisanal feel",
  "sunlit-natural": "Natural golden hour sunlight streaming from window, soft shadows, warm cozy atmosphere, lifestyle product photography",
  "magazine-editorial": "High-end magazine editorial style, sophisticated lighting, artistic composition, luxury brand photography aesthetic",
  "360-showcase": "Creative multi-angle collage showing product from 4 different perspectives, clean white background, comprehensive view",
  "detail-focus": "Extreme macro close-up emphasizing textures and materials, shallow depth of field, highlighting craftsmanship and quality",
};

const MODEL_PROMPTS: Record<string, string> = {
  "modern-living-room": "Contemporary minimalist living room interior, model naturally interacting with product, modern furniture, natural daylight through large windows, lifestyle photography",
  "cozy-bedroom": "Warm inviting bedroom setting, soft morning light, model using product in relaxed pose, comfortable textiles, hygge atmosphere",
  "home-office": "Stylish home office environment, model at modern desk, professional yet comfortable setting, good natural lighting, work-from-home lifestyle",
  "kitchen-scene": "Bright modern kitchen, model using product naturally, marble countertops, natural light, clean contemporary design",
  "outdoor-patio": "Beautiful outdoor patio or terrace, model enjoying product in relaxed setting, greenery visible, golden hour lighting",
  "restaurant-cafe": "Upscale restaurant or cafe interior, model with product in social setting, ambient lighting, hospitality atmosphere",
  "hotel-suite": "Luxury hotel room, model in elegant setting, high-end furnishings, sophisticated lighting, travel lifestyle photography",
  "balcony-view": "Urban apartment balcony with city skyline, model enjoying product with view, modern railing, sunset lighting",
  "garden-setting": "Lush green garden setting, model surrounded by plants and flowers, natural daylight, organic outdoor lifestyle",
  "minimal-apartment": "Scandinavian minimal interior, white walls, simple furniture, model with product in clean space, Nordic aesthetic",
  "industrial-loft": "Industrial loft space, exposed brick walls, model in creative environment, urban lifestyle photography",
  "coastal-home": "Beach house interior, light and airy, model in casual coastal setting, ocean-inspired palette, relaxed atmosphere",
  "traditional-indian": "Beautiful traditional Indian home interior, rich colors and textures, model in cultural setting, warm ambient lighting",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, productCategory, productImageUrl, templateId, templateName, photoType } = await req.json();

    if (!productImageUrl || !templateId || !photoType) {
      throw new Error("Missing required parameters");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the appropriate prompt based on photo type and template
    const prompts = photoType === "solo" ? SOLO_PROMPTS : MODEL_PROMPTS;
    const stylePrompt = prompts[templateId] || "Professional product photography, clean aesthetic";

    // Build the generation prompt
    let fullPrompt: string;
    
    if (photoType === "solo") {
      fullPrompt = `Professional product photography for e-commerce.
Product: ${productName} (${productCategory})
Style: ${templateName}

Create a stunning product photograph with these specifications:
${stylePrompt}

The product should be the main focus, photographed with:
- Professional studio lighting
- Sharp focus on product details
- 4:5 aspect ratio optimized for Instagram and e-commerce
- High-end commercial quality
- The product must match exactly what is shown in the reference image

Ultra high resolution, professional product photography.`;
    } else {
      fullPrompt = `Lifestyle product photography with model.
Product: ${productName} (${productCategory})
Scene: ${templateName}

Create an aspirational lifestyle photograph showing:
${stylePrompt}

Requirements:
- A professional model naturally using or displaying the product
- The product must be clearly visible and the focal point
- Authentic, candid moment captured
- Professional editorial quality lighting
- 4:5 or 16:9 aspect ratio
- The product must match exactly what is shown in the reference image

High-end lifestyle photography, magazine quality. Ultra high resolution.`;
    }

    console.log("Generating photo with prompt:", fullPrompt);
    console.log("Product image URL:", productImageUrl);

    // Call Lovable AI image generation
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
                text: fullPrompt,
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
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ imageUrl, message: "Photo generated successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-product-photo:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
