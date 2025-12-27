import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FindSimilarRequest {
  roomImageUrl: string;
  itemLabel: string;
  boundingBox?: number[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomImageUrl, itemLabel, boundingBox }: FindSimilarRequest = await req.json();
    
    console.log('Finding similar furniture for:', itemLabel);
    console.log('Bounding box:', boundingBox);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build prompt for visual analysis
    const analysisPrompt = `Analyze this room image and focus on the ${itemLabel} furniture item${boundingBox ? ` located at approximately ${Math.round((boundingBox[1] + boundingBox[3])/2)}% from left and ${Math.round((boundingBox[0] + boundingBox[2])/2)}% from top of the image` : ''}.

Describe the furniture item's:
1. Style (modern, traditional, minimalist, contemporary, mid-century, scandinavian, industrial, bohemian, coastal, rustic, etc.)
2. Primary colors (list 2-3 main colors)
3. Materials (wood, fabric, leather, metal, glass, rattan, velvet, etc.)
4. Shape characteristics (curved, angular, boxy, organic, streamlined, etc.)
5. Estimated size category (compact, standard, oversized)

Then provide 5-8 search keywords that would help find similar items in a furniture catalog.

Respond ONLY with valid JSON in this exact format:
{
  "style": "primary style name",
  "colors": ["color1", "color2"],
  "materials": ["material1", "material2"],
  "shape": "shape description",
  "size": "size category",
  "searchTerms": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "furniture category like sofa, chair, table, lamp, etc.",
  "description": "brief visual description of the item"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: roomImageUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback with basic search terms from the item label
      analysisResult = {
        style: 'modern',
        colors: [],
        materials: [],
        shape: '',
        size: 'standard',
        searchTerms: itemLabel.toLowerCase().split(' '),
        category: itemLabel.toLowerCase(),
        description: itemLabel
      };
    }

    console.log('Analysis result:', analysisResult);

    return new Response(JSON.stringify({
      success: true,
      itemLabel,
      ...analysisResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Find similar error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
