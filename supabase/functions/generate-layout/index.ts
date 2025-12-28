import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Furniture library matching the frontend
const FURNITURE_LIBRARY = [
  { id: 'sofa-3', name: '3-Seater Sofa', category: 'Seating', width: 84, depth: 36 },
  { id: 'sofa-2', name: '2-Seater Sofa', category: 'Seating', width: 60, depth: 36 },
  { id: 'armchair', name: 'Armchair', category: 'Seating', width: 32, depth: 34 },
  { id: 'dining-chair', name: 'Dining Chair', category: 'Seating', width: 18, depth: 20 },
  { id: 'coffee-table', name: 'Coffee Table', category: 'Tables', width: 48, depth: 24 },
  { id: 'side-table', name: 'Side Table', category: 'Tables', width: 18, depth: 18 },
  { id: 'dining-table-6', name: 'Dining Table (6)', category: 'Tables', width: 72, depth: 36 },
  { id: 'dining-table-4', name: 'Dining Table (4)', category: 'Tables', width: 48, depth: 36 },
  { id: 'desk', name: 'Desk', category: 'Tables', width: 60, depth: 30 },
  { id: 'console', name: 'Console Table', category: 'Tables', width: 48, depth: 14 },
  { id: 'bookshelf', name: 'Bookshelf', category: 'Storage', width: 36, depth: 12 },
  { id: 'dresser', name: 'Dresser', category: 'Storage', width: 60, depth: 18 },
  { id: 'nightstand', name: 'Nightstand', category: 'Storage', width: 24, depth: 18 },
  { id: 'wardrobe', name: 'Wardrobe', category: 'Storage', width: 48, depth: 24 },
  { id: 'tv-stand', name: 'TV Stand', category: 'Storage', width: 60, depth: 18 },
  { id: 'king-bed', name: 'King Bed', category: 'Beds', width: 76, depth: 80 },
  { id: 'queen-bed', name: 'Queen Bed', category: 'Beds', width: 60, depth: 80 },
  { id: 'twin-bed', name: 'Twin Bed', category: 'Beds', width: 38, depth: 75 },
  { id: 'crib', name: 'Crib', category: 'Beds', width: 28, depth: 52 },
  { id: 'floor-lamp', name: 'Floor Lamp', category: 'Decor', width: 12, depth: 12 },
  { id: 'plant-large', name: 'Large Plant', category: 'Decor', width: 24, depth: 24 },
  { id: 'rug-large', name: 'Area Rug (8x10)', category: 'Decor', width: 96, depth: 120 },
  { id: 'rug-medium', name: 'Area Rug (5x7)', category: 'Decor', width: 60, depth: 84 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, roomDimensions, useBrainKnowledge, userId, zoneConstraints } = await req.json();

    console.log('Generating layout for prompt:', prompt);
    console.log('Room dimensions:', roomDimensions);
    console.log('Zone constraints:', zoneConstraints);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch brain knowledge if enabled
    let brainContext = '';
    if (useBrainKnowledge && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [knowledgeRes, stylesRes, layoutsRes] = await Promise.all([
        supabase.from('agent_b_knowledge').select('*').eq('user_id', userId).eq('is_active', true),
        supabase.from('agent_b_style_collections').select('*').eq('user_id', userId).eq('is_active', true),
        supabase.from('agent_b_layout_templates').select('name, room_type').eq('user_id', userId).limit(5),
      ]);

      const rules = knowledgeRes.data?.filter(k => k.knowledge_type === 'rule') || [];
      const preferences = knowledgeRes.data?.filter(k => k.knowledge_type === 'preference') || [];
      
      if (rules.length > 0) {
        brainContext += `\nUser's custom rules:\n${rules.map(r => `- ${r.title}: ${r.content?.text || r.description}`).join('\n')}`;
      }
      if (stylesRes.data && stylesRes.data.length > 0) {
        const style = stylesRes.data[0];
        brainContext += `\nPreferred style: ${style.name}`;
        if (style.furniture_styles?.length) {
          brainContext += ` (${style.furniture_styles.join(', ')})`;
        }
      }
    }

    // Build zone constraint text if provided
    const zoneText = zoneConstraints ? `
ZONE CONSTRAINTS (CRITICAL - furniture MUST be placed within these bounds):
- Zone X start: ${zoneConstraints.x}px
- Zone Y start: ${zoneConstraints.y}px
- Zone width: ${zoneConstraints.width}px
- Zone height: ${zoneConstraints.height}px
All furniture x/y positions MUST be within this zone. Ensure furniture fits entirely within zone boundaries.
` : '';

    const systemPrompt = `You are an expert interior designer AI that generates 2D floor plan layouts.

Available furniture (use these exact IDs):
${FURNITURE_LIBRARY.map(f => `- ${f.id}: ${f.name} (${f.width}" x ${f.depth}")`).join('\n')}

Room dimensions: ${roomDimensions.width} ${roomDimensions.unit} x ${roomDimensions.depth} ${roomDimensions.unit}
${brainContext}
${zoneText}

IMPORTANT RULES:
1. Position furniture using PIXEL coordinates (1 inch = 4 pixels, 1 foot = 48 pixels)
2. Leave adequate clearance (at least 36" / 144px) for walkways
3. Consider natural light from windows (typically on outer walls)
4. Create functional zones (seating area, work area, etc.)
5. Furniture should not overlap
6. Keep furniture away from walls by at least 100 pixels (padding)
7. Room padding is 100 pixels on each side
${zoneConstraints ? '8. ALL furniture MUST be placed WITHIN the specified zone boundaries' : ''}

Return a valid JSON object with this exact structure:
{
  "furniture": [
    { "id": "furniture-id", "x": 200, "y": 200, "rotation": 0, "reasoning": "brief explanation" }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

x and y are the LEFT and TOP positions in pixels from the canvas origin (including the 100px room padding).
rotation is in degrees (0, 90, 180, 270).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a layout for: ${prompt}` }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    let layoutData;
    try {
      layoutData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI layout response');
    }

    // Validate and enhance the layout data
    const validatedFurniture = layoutData.furniture?.map((item: any) => {
      const furnitureDef = FURNITURE_LIBRARY.find(f => f.id === item.id);
      if (!furnitureDef) {
        console.warn('Unknown furniture ID:', item.id);
        return null;
      }
      return {
        ...item,
        name: furnitureDef.name,
        category: furnitureDef.category,
        width: furnitureDef.width,
        depth: furnitureDef.depth,
      };
    }).filter(Boolean) || [];

    return new Response(JSON.stringify({
      furniture: validatedFurniture,
      suggestions: layoutData.suggestions || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-layout:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});