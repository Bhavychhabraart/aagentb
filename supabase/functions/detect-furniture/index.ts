import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectedObject {
  id: string;
  label: string;
  x: number; // Center X percentage (0-100)
  y: number; // Center Y percentage (0-100)
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 space
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomImageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!roomImageUrl) {
      throw new Error('Room image URL is required');
    }

    console.log('Detecting furniture in room image...');

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'image_url', image_url: { url: roomImageUrl } },
      {
        type: 'text',
        text: `You are a furniture detection AI. Analyze this interior room image and identify ALL furniture and decor items.

OUTPUT FORMAT - You MUST return ONLY a valid JSON array with NO additional text:

[
  {"label": "Sofa", "box_2d": [320, 150, 650, 720]},
  {"label": "Coffee Table", "box_2d": [480, 250, 580, 550]},
  {"label": "Floor Lamp", "box_2d": [100, 680, 400, 780]}
]

RULES:
1. Return ONLY the JSON array - no markdown, no backticks, no explanations
2. Each object MUST have exactly 2 properties: "label" (string) and "box_2d" (array of 4 integers)
3. box_2d format: [ymin, xmin, ymax, xmax] where values are 0-1000 (representing 0-100% of image)
4. Use descriptive labels like "Sectional Sofa", "Round Coffee Table", "Floor Lamp", "Area Rug"
5. Detect: sofas, chairs, tables, lamps, plants, rugs, beds, dressers, cabinets, shelves, artwork, mirrors
6. Do NOT detect architectural features (walls, windows, doors, ceilings, floors)
7. Each item MUST be a complete JSON object - never leave objects incomplete
8. Double-check your JSON is valid before responding

EXAMPLE VALID RESPONSE:
[{"label": "Modern Sofa", "box_2d": [400, 100, 700, 600]}, {"label": "Coffee Table", "box_2d": [550, 200, 650, 500]}]`
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
      console.error('No text response from model');
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Raw AI response length:', textResponse.length);

    // Clean and parse JSON response
    let cleanText = textResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Find the JSON array boundaries
    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    }
    
    // Fix common JSON issues
    // Remove trailing commas before ]
    cleanText = cleanText.replace(/,\s*]/g, ']');
    // Remove trailing commas before }
    cleanText = cleanText.replace(/,\s*}/g, '}');
    // Fix incomplete objects by removing them
    cleanText = cleanText.replace(/,?\s*\{[^}]*$/g, '');
    // Ensure proper closing
    if (!cleanText.endsWith(']')) {
      cleanText = cleanText + ']';
    }
    // Sanitize invalid numbers with leading zeros (e.g. 01 -> 1)
    cleanText = cleanText.replace(/(\[|,)\s*0+([1-9])/g, '$1$2');
    
    let items: DetectedObject[];
    try {
      const parsed = JSON.parse(cleanText);
      // Handle both array and object with items property
      const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.furniture || parsed.objects || []);
      
      if (!Array.isArray(rawItems)) {
        console.error('Parsed response is not an array:', typeof rawItems);
        items = [];
      } else {
        // Filter and validate items
        items = rawItems
          .filter((item: any) => {
            // Must have label
            if (!item.label || typeof item.label !== 'string') {
              console.log('Skipping item without valid label:', item);
              return false;
            }
            // Must have valid box_2d
            if (!item.box_2d || !Array.isArray(item.box_2d) || item.box_2d.length !== 4) {
              console.log('Skipping item without valid box_2d:', item);
              return false;
            }
            // All values must be numbers
            const allNumbers = item.box_2d.every((v: any) => typeof v === 'number' && !isNaN(v));
            if (!allNumbers) {
              console.log('Skipping item with non-numeric box_2d values:', item);
              return false;
            }
            return true;
          })
          .map((item: any, index: number) => {
            const [ymin, xmin, ymax, xmax] = item.box_2d.map((v: number) => Math.max(0, Math.min(1000, Math.round(v))));
            const centerY = (ymin + ymax) / 2;
            const centerX = (xmin + xmax) / 2;
            
            return {
              id: `detected_${index}_${Date.now()}`,
              label: item.label.trim(),
              x: Math.max(0, Math.min(100, centerX / 10)), // Convert 0-1000 to 0-100
              y: Math.max(0, Math.min(100, centerY / 10)),
              box_2d: [ymin, xmin, ymax, xmax] as [number, number, number, number]
            };
          });
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', cleanText.substring(0, 500));
      items = [];
    }

    console.log('Detected furniture items:', items.length);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('detect-furniture error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});