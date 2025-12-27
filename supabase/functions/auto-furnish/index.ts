import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price?: number;
  imageUrl?: string;
}

interface FurnitureSuggestion {
  catalog_id: string;
  reason: string;
  position: { x: number; y: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomImageUrl, preferences, catalogItems } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!roomImageUrl) {
      throw new Error('Room image URL is required');
    }

    if (!catalogItems || !Array.isArray(catalogItems) || catalogItems.length === 0) {
      throw new Error('Catalog items are required');
    }

    console.log('Analyzing room for auto-furnishing with', catalogItems.length, 'catalog items...');

    // Build catalog reference for the AI
    const catalogReference = catalogItems.slice(0, 50).map((item: CatalogItem) => 
      `ID: "${item.id}" | Name: "${item.name}" | Category: "${item.category}" | Price: $${item.price || 0}`
    ).join('\n');

    const content = [
      { type: 'image_url', image_url: { url: roomImageUrl } },
      {
        type: 'text',
        text: `Analyze this interior room image and select furniture from the provided catalog to add or improve the space.

AVAILABLE CATALOG ITEMS (select ONLY from these):
${catalogReference}

Instructions:
1. Analyze the room's current style, empty spaces, and functional needs
2. Select 4-6 items from the catalog above that would enhance this room
3. For each selection, provide the EXACT catalog ID and explain why it fits

${preferences ? `User preferences: ${preferences}` : ''}

Return ONLY valid JSON in this exact format:
{
  "detected_style": "The overall design style (e.g., Modern Minimalist, Scandinavian)",
  "suggestions": [
    {
      "catalog_id": "exact-id-from-catalog-above",
      "reason": "Brief explanation why this item fits the room",
      "position": {"x": 50, "y": 50}
    }
  ]
}

CRITICAL: The catalog_id MUST exactly match one of the IDs provided above. Do not invent new IDs.`
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

    // Validate catalog IDs - filter out any that don't exist in catalog
    const validCatalogIds = new Set(catalogItems.map((item: CatalogItem) => item.id));
    const validSuggestions = (result.suggestions || []).filter((s: FurnitureSuggestion) => 
      validCatalogIds.has(s.catalog_id)
    );

    console.log('Auto-furnish suggestions:', validSuggestions.length, 'valid out of', result.suggestions?.length || 0);

    return new Response(JSON.stringify({
      detected_style: result.detected_style || 'Contemporary',
      suggestions: validSuggestions,
    }), {
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
