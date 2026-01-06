import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FurnitureAnalysis {
  type: string;
  shape: 'rectangular' | 'circular' | 'L-shaped' | 'irregular';
  centerX: number;
  centerY: number;
  widthPercent: number;
  heightPercent: number;
  rotationDegrees: number;
  facingDirection: string;
  estimatedRealSize: string;
}

interface ArchitecturalFeature {
  type: 'window' | 'door' | 'opening' | 'column' | 'stairs';
  wall: 'top' | 'bottom' | 'left' | 'right' | 'center';
  positionPercent: number;
  widthPercent: number;
}

export interface ZoneAnalysis {
  zoneType: string;
  estimatedDimensions: {
    widthFeet: number;
    depthFeet: number;
    aspectRatio: string;
  };
  furniture: FurnitureAnalysis[];
  architecturalFeatures: ArchitecturalFeature[];
  spatialRelationships: string[];
  sceneDescription: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { layoutZoneBase64, zoneName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!layoutZoneBase64) {
      throw new Error('layoutZoneBase64 is required for zone analysis');
    }

    console.log('=== ZONE ANALYSIS REQUEST ===');
    console.log('Zone name:', zoneName || 'unnamed');
    console.log('Image data length:', layoutZoneBase64.length);

    const analysisPrompt = `You are an expert floor plan analyst. Analyze this 2D floor plan zone image and extract PRECISE information about every element visible.

ANALYZE THE IMAGE AND RETURN A JSON OBJECT with this exact structure:

{
  "zoneType": "living_area | dining_area | bedroom | office | kitchen | hallway | bathroom",
  "estimatedDimensions": {
    "widthFeet": <estimated width in feet>,
    "depthFeet": <estimated depth in feet>,
    "aspectRatio": "<width:height ratio like 4:3 or 16:9>"
  },
  "furniture": [
    {
      "type": "<exact furniture type: sofa, armchair, coffee_table, dining_table, bed, desk, chair, console, bookshelf, tv_unit, plant, rug, etc>",
      "shape": "rectangular | circular | L-shaped | irregular",
      "centerX": <0-100 percentage from left edge>,
      "centerY": <0-100 percentage from top edge>,
      "widthPercent": <0-100 percentage of total zone width>,
      "heightPercent": <0-100 percentage of total zone height>,
      "rotationDegrees": <0, 45, 90, 135, 180, 225, 270, 315>,
      "facingDirection": "north | south | east | west | ne | nw | se | sw",
      "estimatedRealSize": "<like '7ft sofa' or '4ft round table' or '3x5ft rug'>"
    }
  ],
  "architecturalFeatures": [
    {
      "type": "window | door | opening | column | stairs",
      "wall": "top | bottom | left | right | center",
      "positionPercent": <0-100 along that wall>,
      "widthPercent": <0-100 width as percentage>
    }
  ],
  "spatialRelationships": [
    "<description like 'sofa faces the window on the top wall'>",
    "<description like 'coffee table is centered in front of sofa'>",
    "<description like 'armchairs flank the sofa on both sides'>",
    "<description like 'dining table is positioned near the right wall'>"
  ],
  "sceneDescription": "<A detailed 2-3 sentence description of what this zone represents, the overall arrangement, and the likely function of the space. Be specific about the layout and furniture positioning.>"
}

IMPORTANT RULES:
1. Identify EVERY distinct shape as a piece of furniture - be thorough
2. Be PRECISE about positions - use percentages from 0-100
3. Note the ORIENTATION/ROTATION of each piece based on its shape in the floor plan
4. Identify relationships between furniture pieces (what faces what, what's next to what)
5. Include ALL windows and doors visible in the zone
6. Output ONLY valid JSON, no markdown code blocks or explanation
7. If you see symbols or icons in the floor plan, interpret what furniture they represent

Analyze the floor plan zone image now and return the JSON:`;

    console.log('Calling Gemini 2.5 Pro for zone analysis...');
    
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: layoutZoneBase64 } },
            { type: 'text', text: analysisPrompt }
          ]
        }],
      }),
    });

    if (!analysisResponse.ok) {
      if (analysisResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (analysisResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await analysisResponse.text();
      console.error('AI gateway error:', analysisResponse.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices?.[0]?.message?.content || '';
    
    console.log('Raw analysis response length:', analysisText.length);
    console.log('Raw response preview:', analysisText.substring(0, 300));

    // Parse the JSON response
    let zoneAnalysis: ZoneAnalysis;
    
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = analysisText.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Try to find raw JSON object
        const rawJsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (rawJsonMatch) {
          jsonStr = rawJsonMatch[0];
        }
      }
      
      zoneAnalysis = JSON.parse(jsonStr);
      
      console.log('=== ZONE ANALYSIS COMPLETE ===');
      console.log('Zone type:', zoneAnalysis.zoneType);
      console.log('Furniture count:', zoneAnalysis.furniture?.length || 0);
      console.log('Architectural features:', zoneAnalysis.architecturalFeatures?.length || 0);
      console.log('Spatial relationships:', zoneAnalysis.spatialRelationships?.length || 0);
      
      // Validate required fields
      if (!zoneAnalysis.zoneType) {
        zoneAnalysis.zoneType = 'unknown';
      }
      if (!zoneAnalysis.furniture) {
        zoneAnalysis.furniture = [];
      }
      if (!zoneAnalysis.architecturalFeatures) {
        zoneAnalysis.architecturalFeatures = [];
      }
      if (!zoneAnalysis.spatialRelationships) {
        zoneAnalysis.spatialRelationships = [];
      }
      if (!zoneAnalysis.sceneDescription) {
        zoneAnalysis.sceneDescription = 'Interior space with furniture as shown in the floor plan.';
      }
      if (!zoneAnalysis.estimatedDimensions) {
        zoneAnalysis.estimatedDimensions = {
          widthFeet: 12,
          depthFeet: 10,
          aspectRatio: '4:3'
        };
      }
      
    } catch (parseError) {
      console.error('Failed to parse zone analysis JSON:', parseError);
      console.error('Response that failed to parse:', analysisText);
      
      // Return a basic analysis if parsing fails
      zoneAnalysis = {
        zoneType: 'living_area',
        estimatedDimensions: {
          widthFeet: 12,
          depthFeet: 10,
          aspectRatio: '4:3'
        },
        furniture: [],
        architecturalFeatures: [],
        spatialRelationships: [],
        sceneDescription: 'Unable to fully analyze the zone. Please check the floor plan clarity.'
      };
    }

    return new Response(JSON.stringify({ 
      analysis: zoneAnalysis,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Zone analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
