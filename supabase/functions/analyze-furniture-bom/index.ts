import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, description, category, estimatedPrice } = await req.json();
    
    console.log('Analyzing BOM for furniture:', { category, description: description?.slice(0, 50) });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt for BOM analysis
    const systemPrompt = `You are a furniture manufacturing expert. Analyze the furniture piece and provide a detailed Bill of Materials (BOM) breakdown.

For each component, estimate:
- Material type and quality
- Quantity needed
- Estimated cost in Indian Rupees (₹)

Consider materials commonly used in Indian furniture manufacturing.
Be specific about wood types, fabric types, hardware, etc.

Respond ONLY with valid JSON in this exact format:
{
  "components": [
    {
      "component": "string (e.g., 'Main Frame', 'Seat Cushion', 'Legs')",
      "material": "string (e.g., 'Teak Wood', 'Velvet Fabric', 'Brass')",
      "quantity": "string (e.g., '1 set', '2 sq.m', '4 pcs')",
      "estimatedCost": number
    }
  ],
  "laborCost": number,
  "totalEstimate": number,
  "notes": ["string array of important notes about materials or construction"]
}`;

    const userPrompt = `Analyze this furniture piece and provide a BOM breakdown:

Category: ${category || 'Furniture'}
Description: ${description || 'Not provided'}
Estimated Retail Price: ₹${estimatedPrice || 'Unknown'}

${imageUrl ? 'An image of the furniture has been provided for visual analysis.' : 'No image provided, analyze based on description.'}

Provide a detailed breakdown of all materials, components, and estimated costs for manufacturing this piece in India.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing JSON');

    // Parse the JSON response
    let bomData;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      bomData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse BOM JSON:', parseError, content);
      
      // Provide fallback BOM data
      bomData = {
        components: [
          { component: 'Primary Structure', material: 'Wood/Metal', quantity: '1 set', estimatedCost: Math.round((estimatedPrice || 50000) * 0.3) },
          { component: 'Upholstery', material: 'Fabric/Leather', quantity: '2 sq.m', estimatedCost: Math.round((estimatedPrice || 50000) * 0.2) },
          { component: 'Hardware', material: 'Metal Fittings', quantity: '1 set', estimatedCost: Math.round((estimatedPrice || 50000) * 0.1) },
          { component: 'Finishing', material: 'Polish/Paint', quantity: '1 set', estimatedCost: Math.round((estimatedPrice || 50000) * 0.1) },
        ],
        laborCost: Math.round((estimatedPrice || 50000) * 0.15),
        totalEstimate: Math.round((estimatedPrice || 50000) * 0.85),
        notes: [
          'Estimates based on standard manufacturing costs',
          'Actual costs may vary based on material quality and sourcing',
          'Custom designs may require additional tooling costs'
        ]
      };
    }

    // Ensure required fields exist
    if (!bomData.totalEstimate) {
      bomData.totalEstimate = bomData.components.reduce((sum: number, c: any) => sum + (c.estimatedCost || 0), 0) + (bomData.laborCost || 0);
    }

    console.log('BOM analysis complete');

    return new Response(
      JSON.stringify(bomData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('BOM analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
