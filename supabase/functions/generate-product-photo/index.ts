import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOLO_PROMPTS: Record<string, string> = {
  // Classic Templates
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
  
  // Artistic Warm Tone Templates
  "terracotta-studio": "Rich terracotta and burnt orange seamless backdrop, warm dramatic studio lighting with soft shadows, furniture displayed as sculptural art piece, earthy Mediterranean aesthetic, professional product photography with amber rim lighting, warm color palette with sienna and rust tones, ultra high-end furniture catalog style",
  "chocolate-moody": "Deep chocolate brown backdrop with subtle gradient to espresso, dramatic side lighting creating sculptural shadows, luxurious moody atmosphere, rich warm undertones, furniture as hero piece, professional editorial photography, sophisticated dark aesthetic with bronze highlights",
  "amber-glow": "Golden amber gradient background transitioning from honey to bronze, warm sculptural lighting emphasizing form and texture, golden hour indoor studio aesthetic, soft glowing rim light, furniture displayed as art object, warm radiant atmosphere, high-end artisan photography",
  "ochre-earth": "Earthy ochre and mustard yellow backdrop, natural warmth and organic aesthetic, soft diffused lighting with warm temperature, Mediterranean villa atmosphere, raw natural beauty, furniture as centerpiece, artisanal craft photography style",
  "raw-wood-surface": "Live-edge natural wood slab as surface, organic styling with dried botanicals, warm directional lighting, raw authentic aesthetic, showcasing natural materials, woodworking atelier atmosphere, handcrafted furniture photography",
  "sculptural-shadow": "Neutral warm gray backdrop with dramatic directional lighting, deep sculptural shadows emphasizing furniture form and curves, artistic high-contrast photography, furniture as sculpture, museum-quality presentation, architectural lighting design",
  "artisan-detail": "Extreme macro close-up on wood grain, joinery details, and material textures, warm amber lighting, shallow depth of field bokeh, highlighting craftsmanship and quality, artisan workshop aesthetic, ultra-detailed product photography",
  "resin-art-surface": "Epoxy resin surface with natural wood patterns, live-edge aesthetic, warm amber and honey tones visible in resin, artistic surface photography, modern meets organic, luxury craft aesthetic",
  "leather-backdrop": "Rich cognac leather texture as backdrop, warm brown tones, soft studio lighting, luxury goods aesthetic, premium material pairing, sophisticated product photography",
  "desert-warmth": "Sand and terracotta gradient background, minimalist desert aesthetic, warm golden lighting, earthy natural tones, serene clean composition, organic luxury photography",
  "museum-display": "Gallery-style white pedestal presentation, warm museum lighting, furniture as art installation, sophisticated neutral backdrop, contemporary art gallery aesthetic, curated collection photography",
  "organic-forms": "Soft curved surfaces emphasized through warm lighting, flowing organic shapes highlighted, sculptural furniture photography, biomorphic aesthetic, warm neutral backdrop, artistic form study",
};

const MODEL_PROMPTS: Record<string, string> = {
  // Classic Lifestyle Templates
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
  
  // Editorial Warm Tone Templates with Models
  "warm-editorial": "Professional model seated elegantly on furniture, rich warm brown studio backdrop with terracotta accents, editorial fashion photography lighting, model wearing earth-toned designer outfit, sophisticated relaxed pose, high-end furniture catalog with lifestyle element, warm amber rim lighting, magazine cover quality",
  "sculptural-interaction": "Model leaning on or touching furniture as sculptural art piece, dramatic warm studio lighting, chocolate and amber backdrop, artistic pose emphasizing furniture form, model as accent to product, editorial photography with artistic composition, warm moody atmosphere",
  "intimate-moment": "Model in casual contemplative seated pose on furniture, warm cozy studio setting with terracotta backdrop, soft intimate lighting, authentic relaxed moment captured, lifestyle editorial photography, warm earth tones, comfortable luxury aesthetic",
  "fashion-forward": "Model in high-fashion designer outfit with furniture as prop, rich brown gradient backdrop, dramatic editorial lighting, fashion-forward poses, furniture as luxury lifestyle element, warm sophisticated color palette, Vogue-style photography",
  "contemplative-pose": "Model in thoughtful artistic position on furniture, warm amber studio lighting, sculptural composition emphasizing both model and furniture, editorial portrait style, sophisticated warm backdrop, meditative quality",
  "artisan-workshop": "Model examining furniture craftsmanship details, warm workshop-inspired setting, artisanal aesthetic, rich wood tones visible, appreciation of handcraft, warm natural lighting, heritage craft narrative",
  "books-and-style": "Model with books and lifestyle accessories on furniture, warm library aesthetic, rich brown and amber tones, intellectual lifestyle photography, sophisticated editorial setting, warm ambient lighting",
  "warm-earth-tones": "Rich terracotta and sienna setting, model in earth-toned outfit interacting with furniture, warm Mediterranean villa aesthetic, golden hour quality lighting, lifestyle editorial photography, organic luxury feel",
  "tropical-accent": "Furniture with tropical plant accents, model in scene with lush greenery, warm natural lighting, botanical interior aesthetic, indoor-outdoor lifestyle, warm humidity atmosphere",
  "heritage-craftsmanship": "Indian artisan aesthetic with modern styling, model appreciating traditional craft elements, rich warm colors, cultural heritage meets contemporary design, warm directional lighting, premium craft narrative",
  "fabric-draped": "Luxurious warm-toned throw or fabric draped on furniture, model in comfortable position, rich textile textures, cozy editorial styling, warm amber lighting, premium lifestyle photography",
  "golden-hour-interior": "Warm sunset light flooding interior scene through windows, model silhouetted with furniture, golden hour magic, warm intimate atmosphere, lifestyle editorial, romantic warm lighting",
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
