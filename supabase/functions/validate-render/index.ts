import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LayoutAnalysis {
  roomShape: string;
  dimensions: { width: number; depth: number; height: number; unit: string };
  walls: { position: string; features: { type: string; positionPercent: number }[] }[];
  windows: { wall: string; positionPercent: number; widthPercent: number }[];
  doors: { wall: string; positionPercent: number }[];
  furnitureZones: { name: string; xStart: number; xEnd: number; yStart: number; yEnd: number }[];
}

interface ValidationResult {
  overallScore: number;
  passed: boolean;
  checks: {
    category: string;
    name: string;
    expected: string;
    detected: string;
    score: number;
    passed: boolean;
  }[];
  discrepancies: string[];
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { renderUrl, layoutAnalysis, furnitureItems } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!renderUrl) {
      throw new Error('Render URL is required');
    }

    console.log('Validating render against layout specifications...');

    const analysis = layoutAnalysis as LayoutAnalysis;

    // Build validation prompt
    const validationPrompt = `You are an expert interior design render quality validator. Analyze this render image and compare it against the architectural specifications.

LAYOUT SPECIFICATIONS TO VALIDATE AGAINST:
${JSON.stringify(analysis, null, 2)}

FURNITURE ITEMS THAT SHOULD BE PRESENT:
${furnitureItems?.map((f: { name: string; category: string }) => `- ${f.name} (${f.category})`).join('\n') || 'None specified'}

VALIDATION TASKS:
1. COUNT all visible windows and compare to specification
2. IDENTIFY which walls have windows visible
3. CHECK door positions match specifications
4. VERIFY room proportions appear correct
5. CONFIRM furniture is in appropriate zones
6. ASSESS overall layout accuracy

OUTPUT FORMAT (JSON only):
{
  "overallScore": <0-100>,
  "passed": <true if score >= 85>,
  "checks": [
    {
      "category": "windows" | "doors" | "proportions" | "furniture" | "walls",
      "name": "<specific check name>",
      "expected": "<what the spec says>",
      "detected": "<what the render shows>",
      "score": <0-100>,
      "passed": <true/false>
    }
  ],
  "discrepancies": [
    "<specific issue found>"
  ],
  "suggestions": [
    "<how to fix in next generation>"
  ]
}

BE STRICT: The goal is 111% layout accuracy. Any deviation should be flagged.
OUTPUT: Return ONLY the JSON object.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: renderUrl } },
              { type: 'text', text: validationPrompt }
            ]
          }
        ],
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
      throw new Error('Failed to validate render');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No validation content returned');
    }

    console.log('Raw validation response:', content.substring(0, 500));

    // Parse JSON from response
    let validationResult: ValidationResult;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();
      
      validationResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse validation JSON:', parseError);
      // Return a default result if parsing fails
      validationResult = {
        overallScore: 75,
        passed: false,
        checks: [],
        discrepancies: ['Could not fully analyze render'],
        suggestions: ['Try regenerating with clearer specifications'],
      };
    }

    console.log('Validation complete. Score:', validationResult.overallScore);

    return new Response(JSON.stringify({ 
      validation: validationResult,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('validate-render error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
