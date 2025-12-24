import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreferenceItem {
  key: string;
  weight: number;
}

interface UserPreferences {
  styles: PreferenceItem[];
  colors: PreferenceItem[];
  furniture: PreferenceItem[];
  functions: PreferenceItem[];
  lighting: PreferenceItem[];
  budget: PreferenceItem[];
}

interface AnalysisRequest {
  userPrompt: string;
  layoutUrl?: string;
  roomPhotoUrl?: string;
  styleRefUrls?: string[];
  stagedProducts?: Array<{ name: string; category: string; imageUrl?: string }>;
  userPreferences?: UserPreferences;
  memoryEnabled?: boolean;
}

interface AnalysisResponse {
  understanding: {
    roomType: string;
    detectedStyle: string;
    dimensions: string;
    colorPalette: string[];
    stagedProducts: string[];
    hasLayout: boolean;
    hasStyleRef: boolean;
    layoutAnalysis?: string;
    styleNotes?: string;
    rememberedPreferences?: string[];
  };
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    type: 'single' | 'multiple';
    preselected?: string[];
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData: AnalysisRequest = await req.json();
    const { 
      userPrompt, 
      layoutUrl, 
      roomPhotoUrl, 
      styleRefUrls = [], 
      stagedProducts = [],
      userPreferences,
      memoryEnabled = false,
    } = requestData;

    console.log("Agent B analyzing:", {
      hasPrompt: !!userPrompt,
      hasLayout: !!layoutUrl,
      hasRoomPhoto: !!roomPhotoUrl,
      styleRefCount: styleRefUrls.length,
      productCount: stagedProducts.length,
      memoryEnabled,
      hasPreferences: !!userPreferences,
    });

    // Build preferences context for the AI
    let preferencesContext = '';
    if (memoryEnabled && userPreferences) {
      const prefParts: string[] = [];
      
      if (userPreferences.styles.length > 0) {
        prefParts.push(`Preferred styles: ${userPreferences.styles.map(p => p.key).join(', ')}`);
      }
      if (userPreferences.colors.length > 0) {
        prefParts.push(`Preferred colors: ${userPreferences.colors.map(p => p.key).join(', ')}`);
      }
      if (userPreferences.furniture.length > 0) {
        prefParts.push(`Preferred furniture: ${userPreferences.furniture.map(p => p.key).join(', ')}`);
      }
      if (userPreferences.functions.length > 0) {
        prefParts.push(`Preferred room functions: ${userPreferences.functions.map(p => p.key).join(', ')}`);
      }
      if (userPreferences.lighting.length > 0) {
        prefParts.push(`Preferred lighting: ${userPreferences.lighting.map(p => p.key).join(', ')}`);
      }
      if (userPreferences.budget.length > 0) {
        prefParts.push(`Budget preferences: ${userPreferences.budget.map(p => p.key).join(', ')}`);
      }
      
      if (prefParts.length > 0) {
        preferencesContext = `\n\nUser's learned preferences (use these to personalize questions and pre-select options):\n${prefParts.join('\n')}`;
      }
    }

    // Build messages for AI analysis
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      {
        role: "system",
        content: `You are Agent B, an intelligent interior design consultant with memory capabilities. Analyze the user's input and extract understanding about their design intent.
${preferencesContext}

Your task:
1. Identify the room type (living room, bedroom, kitchen, etc.)
2. Detect the design style from any references or descriptions
3. Note any staged products and their categories
4. Generate 5 smart clarifying questions to better understand their vision
5. If user preferences are provided, acknowledge them in your understanding and pre-select matching options in questions

${memoryEnabled ? `IMPORTANT: The user has Design Memory enabled. Use their learned preferences to:
- Pre-select options in questions that match their preferences
- Skip questions they've consistently answered the same way (weight > 3)
- Include a "rememberedPreferences" field listing which preferences you're using
- Make the experience feel personalized` : ''}

Return ONLY valid JSON in this exact format:
{
  "understanding": {
    "roomType": "string (e.g., 'Living Room', 'Master Bedroom')",
    "detectedStyle": "string (e.g., 'Modern Minimalist', 'Scandinavian')",
    "dimensions": "string (e.g., '15x20 ft' or 'Standard')",
    "colorPalette": ["#hex1", "#hex2", "#hex3"],
    "stagedProducts": ["product names"],
    "hasLayout": boolean,
    "hasStyleRef": boolean,
    "layoutAnalysis": "brief description of layout if available",
    "styleNotes": "brief style observations",
    "rememberedPreferences": ["preference 1 used", "preference 2 used"] // only if memory enabled
  },
  "questions": [
    {
      "id": 1,
      "question": "What is the primary function of this room?",
      "options": ["Relaxation & Entertainment", "Work & Productivity", "Guest Hosting", "Multi-purpose"],
      "type": "single",
      "preselected": ["Relaxation & Entertainment"] // based on user preferences
    },
    // ... 4 more questions
  ]
}

Make questions contextual - if they provided style refs, don't ask about style. If they have products, ask about placement preferences.`
      }
    ];

    // Build user message with images if available
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Add text content
    let textContent = `User's request: "${userPrompt || 'Design my space'}"

Available context:`;

    if (layoutUrl) {
      textContent += `\n- Floor plan/layout provided`;
    }
    if (roomPhotoUrl) {
      textContent += `\n- Room photo provided`;
    }
    if (styleRefUrls.length > 0) {
      textContent += `\n- ${styleRefUrls.length} style reference image(s) provided`;
    }
    if (stagedProducts.length > 0) {
      textContent += `\n- Staged products: ${stagedProducts.map(p => `${p.name} (${p.category})`).join(', ')}`;
    }

    userContent.push({ type: "text", text: textContent });

    // Add images for vision analysis
    if (roomPhotoUrl) {
      userContent.push({ 
        type: "image_url", 
        image_url: { url: roomPhotoUrl } 
      });
    }
    if (layoutUrl) {
      userContent.push({ 
        type: "image_url", 
        image_url: { url: layoutUrl } 
      });
    }
    // Add first style ref if available
    if (styleRefUrls.length > 0) {
      userContent.push({ 
        type: "image_url", 
        image_url: { url: styleRefUrls[0] } 
      });
    }

    messages.push({
      role: "user",
      content: userContent.length > 1 ? userContent : textContent,
    });

    console.log("Calling Lovable AI for analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("AI response received, parsing...");

    // Parse the JSON response
    let analysisResult: AnalysisResponse;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      analysisResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      
      // Build fallback with preferences if available
      const fallbackPreselected = memoryEnabled && userPreferences?.functions?.length 
        ? [userPreferences.functions[0].key] 
        : [];
      
      // Return a fallback response
      analysisResult = {
        understanding: {
          roomType: "Living Space",
          detectedStyle: userPreferences?.styles?.[0]?.key || "Contemporary",
          dimensions: "Standard",
          colorPalette: userPreferences?.colors?.slice(0, 3).map(c => c.key) || ["#F5F5F5", "#2C3E50", "#3498DB"],
          stagedProducts: stagedProducts.map(p => p.name),
          hasLayout: !!layoutUrl,
          hasStyleRef: styleRefUrls.length > 0,
          layoutAnalysis: layoutUrl ? "Floor plan detected" : undefined,
          styleNotes: "Modern aesthetic detected",
          rememberedPreferences: memoryEnabled ? userPreferences?.styles?.slice(0, 2).map(s => s.key) : undefined,
        },
        questions: [
          {
            id: 1,
            question: "What is the primary function of this room?",
            options: ["Relaxation & Entertainment", "Work & Productivity", "Guest Hosting", "Family Gathering"],
            type: "single",
            preselected: fallbackPreselected,
          },
          {
            id: 2,
            question: "Preferred color temperature?",
            options: ["Warm (beige, cream, wood tones)", "Cool (gray, blue, white)", "Neutral (balanced mix)", "Bold & Vibrant"],
            type: "single",
          },
          {
            id: 3,
            question: "What lighting mood do you prefer?",
            options: ["Bright & Airy", "Cozy & Dim", "Dramatic & Moody", "Natural Daylight"],
            type: "single",
          },
          {
            id: 4,
            question: "Budget aesthetic?",
            options: ["Luxury & High-end", "Mid-range & Practical", "Budget-friendly", "Mix of Investment Pieces"],
            type: "single",
          },
          {
            id: 5,
            question: "Any specific elements to highlight?",
            options: ["Windows & Natural Light", "Fireplace", "Artwork & Decor", "Architectural Features"],
            type: "multiple",
          },
        ],
      };
    }

    // Ensure staged products are included
    if (stagedProducts.length > 0 && analysisResult.understanding) {
      analysisResult.understanding.stagedProducts = stagedProducts.map(p => p.name);
    }

    console.log("Agent B analysis complete:", {
      roomType: analysisResult.understanding.roomType,
      style: analysisResult.understanding.detectedStyle,
      questionCount: analysisResult.questions.length,
      memoryUsed: !!analysisResult.understanding.rememberedPreferences?.length,
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in agent-b-analyze:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});