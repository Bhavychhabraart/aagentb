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
        text: `Analyze this interior room image.
Identify all distinct furniture and decor items (e.g., Sofa, Chair, Table, Lamp, Plant, Bed, Rug, Painting, Cabinet, Desk).

Return a STRICT JSON array where each object has:
- "label": Name of the item (e.g., "Sofa", "Coffee Table", "Floor Lamp").
- "box_2d": A bounding box [ymin, xmin, ymax, xmax] using 0-1000 coordinate space.

IMPORTANT:
- Do NOT use markdown code blocks or backticks.
- Do NOT include any explanations or text outside the JSON.
- Ensure string values are properly escaped. No unescaped newlines inside strings.
- Only include furniture and decor items, not architectural features like walls or windows.

Example Format:
[
  {"label": "Sofa", "box_2d": [500, 200, 800, 800]},
  {"label": "Coffee Table", "box_2d": [600, 300, 700, 600]},
  {"label": "Floor Lamp", "box_2d": [300, 100, 500, 200]}
]`
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
        response_format: { type: 'json_object' }
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

    // Clean and parse JSON response
    let cleanText = textResponse.replace(/```json|```|```/g, '').trim();
    
    // Sanitize invalid numbers with leading zeros (e.g. 01 -> 1)
    cleanText = cleanText.replace(/(\[|,)\s*0+([1-9])/g, '$1$2');
    
    let items: DetectedObject[];
    try {
      const parsed = JSON.parse(cleanText);
      // Handle both array and object with items property
      const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || parsed.furniture || []);
      
      if (!Array.isArray(rawItems)) {
        console.error('Parsed response is not an array:', cleanText);
        items = [];
      } else {
        items = rawItems.map((item: any, index: number) => {
          let x = 50;
          let y = 50;
          
          if (item.box_2d && Array.isArray(item.box_2d) && item.box_2d.length === 4) {
            const [ymin, xmin, ymax, xmax] = item.box_2d;
            const centerY = (ymin + ymax) / 2;
            const centerX = (xmin + xmax) / 2;
            y = centerY / 10; // Convert 0-1000 to 0-100
            x = centerX / 10;
          } else if (item.x !== undefined && item.y !== undefined) {
            x = item.x;
            y = item.y;
          }

          return {
            id: `detected_${index}_${Date.now()}`,
            label: item.label || 'Unknown Item',
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            box_2d: item.box_2d
          };
        });
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw text:', textResponse);
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
