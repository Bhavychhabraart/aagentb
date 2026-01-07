import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductExtraction {
  name: string;
  category: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  placementInstruction?: string;
  zone?: string;
  description: string;
}

interface FloorPlanExtraction {
  detected: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  zones: Array<{ name: string; products: string[] }>;
}

interface StyleReference {
  type: 'room_photo' | 'texture' | 'material' | 'art';
  boundingBox: { x: number; y: number; width: number; height: number };
  description: string;
}

interface TextAnnotation {
  text: string;
  context: string;
  isPlacementInstruction: boolean;
}

interface MoodBoardAnalysis {
  products: ProductExtraction[];
  floorPlan: FloorPlanExtraction | null;
  styleReferences: StyleReference[];
  colorPalette: string[];
  textAnnotations: TextAnnotation[];
  overallStyle: string;
  designNotes: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls } = await req.json();

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No image URLs provided');
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Analyzing mood board with ${imageUrls.length} image(s)`);

    // Build the content array with all images
    const imageContents = imageUrls.map((url: string) => ({
      type: "image_url",
      image_url: { url }
    }));

    const analysisPrompt = `You are an expert interior design analyst. Analyze this mood board image(s) and extract ALL elements with precision.

## STEP 1: IDENTIFY ALL PRODUCT PHOTOS
Scan systematically for individual furniture/decor product photos:
- Sofas, chairs, dining sets, tables
- Lighting (lamps, pendants, chandeliers)
- Rugs and textiles
- Art pieces and wall decor
- Accessories and accents
- Storage (cabinets, shelves, sideboards)

For EACH product, provide:
- Exact name if labeled (e.g., "Brooklyn Sofa", "Elise Chair")
- Category (seating, table, lighting, rug, art, accessory, storage)
- Bounding box as percentages (x, y, width, height from 0-100)
- Description of material, color, style

## STEP 2: DETECT FLOOR PLAN
Look for any floor plan/layout drawing:
- If found, identify the zones (Living, Dining, Bedroom, etc.)
- Note which products are indicated for each zone
- Provide bounding box of the floor plan

## STEP 3: READ ALL TEXT ANNOTATIONS
Carefully transcribe ALL text visible in the mood board:
- Product names and labels
- Placement instructions (e.g., "Rug under dining", "Add tropical collage on wall")
- Dimensions (e.g., "5 by 3 ft", "7*8 ft panel")
- Designer notes

## STEP 4: EXTRACT STYLE REFERENCES
Identify inspirational room photos or material samples:
- Room inspiration images
- Texture/material swatches
- Art pieces or wallpaper samples

## STEP 5: DETERMINE COLOR PALETTE
Extract the dominant colors as HEX codes.

## STEP 6: OVERALL STYLE
Describe the design direction (e.g., "Modern bohemian with earthy tones", "Contemporary minimalist with warm wood accents").

Return your analysis as valid JSON matching this exact structure:
{
  "products": [
    {
      "name": "Product Name",
      "category": "seating|table|lighting|rug|art|accessory|storage|other",
      "boundingBox": { "x": 0, "y": 0, "width": 20, "height": 30 },
      "placementInstruction": "optional placement note",
      "zone": "optional zone name",
      "description": "detailed description"
    }
  ],
  "floorPlan": {
    "detected": true/false,
    "boundingBox": { "x": 0, "y": 0, "width": 50, "height": 50 },
    "zones": [
      { "name": "Living", "products": ["Sofa Name", "Rug Name"] }
    ]
  },
  "styleReferences": [
    {
      "type": "room_photo|texture|material|art",
      "boundingBox": { "x": 0, "y": 0, "width": 30, "height": 40 },
      "description": "description"
    }
  ],
  "colorPalette": ["#HEXCODE1", "#HEXCODE2"],
  "textAnnotations": [
    {
      "text": "exact text",
      "context": "what it refers to",
      "isPlacementInstruction": true/false
    }
  ],
  "overallStyle": "Style description",
  "designNotes": "Summary of design intent and key elements"
}

Be thorough and precise with bounding boxes. Include EVERY product visible.`;

    const response = await fetch('https://ai.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              ...imageContents
            ]
          }
        ],
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Parse the JSON response
    let analysis: MoodBoardAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a structured error response
      analysis = {
        products: [],
        floorPlan: null,
        styleReferences: [],
        colorPalette: [],
        textAnnotations: [],
        overallStyle: 'Unable to parse',
        designNotes: content
      };
    }

    console.log(`Extracted ${analysis.products?.length || 0} products, ${analysis.textAnnotations?.length || 0} annotations`);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing mood board:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
