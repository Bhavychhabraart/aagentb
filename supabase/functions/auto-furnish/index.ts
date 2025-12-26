import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FurnitureSuggestion {
  type: string;
  name: string;
  style: string;
  position: { x: number; y: number };
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomImageUrl, preferences } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!roomImageUrl) {
      throw new Error('Room image URL is required');
    }

    console.log('Analyzing room for auto-furnishing...');

    const content = [
      { type: 'image_url', image_url: { url: roomImageUrl } },
      {
        type: 'text',
        text: `Analyze this interior room image and suggest furniture to add or improve the space.

Consider:
1. The room's current style and aesthetic
2. Available empty spaces
3. Functional needs (seating, storage, lighting, etc.)
4. Design harmony and balance
5. Traffic flow and ergonomics

${preferences ? `User preferences: ${preferences}` : ''}

Return a JSON object with:
- "detected_style": The overall design style (e.g., "Modern Minimalist", "Scandinavian", "Industrial")
- "suggestions": An array of furniture suggestions, each with:
  - "type": Category (e.g., "Seating", "Table", "Lighting", "Decor")
  - "name": Specific item name (e.g., "Velvet Accent Chair", "Round Coffee Table")
  - "style": Style that matches the room (e.g., "Mid-Century Modern")
  - "position": Approximate position as {x, y} percentages where it should go
  - "reasoning": Brief explanation why this piece would work

Limit to 5-8 most impactful suggestions.

Return ONLY valid JSON, no markdown or explanation.`
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
      return new Response(JSON.stringify({ 
        suggestions: [],
        detected_style: 'Unknown'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON response
    let result;
    try {
      const cleanText = textResponse.replace(/```json|```/g, '').trim();
      result = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw:', textResponse);
      result = { suggestions: [], detected_style: 'Unknown' };
    }

    console.log('Auto-furnish suggestions:', result.suggestions?.length || 0);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('auto-furnish error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
