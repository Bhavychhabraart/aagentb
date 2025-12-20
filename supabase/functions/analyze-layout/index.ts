import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface LayoutAnalysis {
  roomShape: 'rectangular' | 'L-shaped' | 'square' | 'irregular';
  dimensions: {
    width: number;
    depth: number;
    height: number;
    unit: 'feet' | 'meters';
  };
  aspectRatio: string;
  walls: {
    position: 'north' | 'south' | 'east' | 'west';
    length: number;
    features: WallFeature[];
  }[];
  windows: WindowSpec[];
  doors: DoorSpec[];
  furnitureZones: FurnitureZone[];
  cameraRecommendation: CameraSpec;
  gridOverlay: string; // ASCII art representation
}

interface WallFeature {
  type: 'window' | 'door' | 'opening' | 'built-in' | 'fireplace';
  positionPercent: number; // 0-100 from left
  widthPercent: number;
}

interface WindowSpec {
  wall: 'north' | 'south' | 'east' | 'west';
  positionPercent: number;
  widthPercent: number;
  heightPercent: number;
  type: 'standard' | 'floor-to-ceiling' | 'bay' | 'skylight';
}

interface DoorSpec {
  wall: 'north' | 'south' | 'east' | 'west';
  positionPercent: number;
  widthPercent: number;
  type: 'single' | 'double' | 'sliding' | 'french';
  swingDirection: 'inward' | 'outward' | 'left' | 'right';
}

interface FurnitureZone {
  name: string;
  label: string;
  xStart: number; // Percentage 0-100
  xEnd: number;
  yStart: number;
  yEnd: number;
  suggestedItems: string[];
}

interface CameraSpec {
  position: 'southeast' | 'southwest' | 'northeast' | 'northwest' | 'center';
  angle: number; // Degrees from north
  height: 'eye-level' | 'elevated' | 'low';
  fov: 'wide' | 'standard' | 'narrow';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { layoutImageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!layoutImageUrl) {
      throw new Error('Layout image URL is required');
    }

    console.log('Analyzing layout:', layoutImageUrl.substring(0, 100) + '...');

    const analysisPrompt = `You are an expert architectural floor plan analyzer. Analyze this 2D floor plan image and extract precise structural data.

TASK: Parse this floor plan and output a JSON object with the following structure:

{
  "roomShape": "rectangular" | "L-shaped" | "square" | "irregular",
  "dimensions": {
    "width": <number in feet>,
    "depth": <number in feet>,
    "height": 9,
    "unit": "feet"
  },
  "aspectRatio": "<width:depth ratio like '4:3' or '16:9'>",
  "walls": [
    {
      "position": "north" | "south" | "east" | "west",
      "length": <feet>,
      "features": [
        { "type": "window" | "door" | "opening", "positionPercent": <0-100>, "widthPercent": <0-100> }
      ]
    }
  ],
  "windows": [
    {
      "wall": "north" | "south" | "east" | "west",
      "positionPercent": <0-100 from left edge of wall>,
      "widthPercent": <percentage of wall width>,
      "heightPercent": 60,
      "type": "standard" | "floor-to-ceiling" | "bay"
    }
  ],
  "doors": [
    {
      "wall": "north" | "south" | "east" | "west",
      "positionPercent": <0-100>,
      "widthPercent": <percentage>,
      "type": "single" | "double" | "sliding",
      "swingDirection": "inward" | "outward" | "left" | "right"
    }
  ],
  "furnitureZones": [
    {
      "name": "seating_area",
      "label": "Primary Seating",
      "xStart": <0-100>,
      "xEnd": <0-100>,
      "yStart": <0-100>,
      "yEnd": <0-100>,
      "suggestedItems": ["sofa", "coffee table", "armchair"]
    }
  ],
  "cameraRecommendation": {
    "position": "southeast" | "southwest" | "northeast" | "northwest",
    "angle": <degrees from north, 0-360>,
    "height": "eye-level",
    "fov": "wide" | "standard"
  },
  "gridOverlay": "<ASCII art grid showing room layout with zones marked>"
}

ANALYSIS RULES:
1. ORIENTATION: Assume the top of the floor plan is NORTH
2. MEASUREMENTS: If dimensions are shown, use them. Otherwise estimate based on standard furniture sizes shown
3. POSITIONS: All positions are percentages (0-100) from the LEFT edge of each wall
4. FURNITURE ZONES: Identify logical zones based on furniture placement shown or room function
5. CAMERA: Recommend the best camera angle for a 3D render (usually a corner view)
6. Be PRECISE - this data will be used to generate accurate 3D renders

OUTPUT: Return ONLY the JSON object, no other text.`;

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
              { type: 'image_url', image_url: { url: layoutImageUrl } },
              { type: 'text', text: analysisPrompt }
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
      throw new Error('Failed to analyze layout');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis content returned');
    }

    console.log('Raw analysis response:', content.substring(0, 500));

    // Parse JSON from response (handle markdown code blocks)
    let analysisJson: LayoutAnalysis;
    try {
      // Remove markdown code blocks if present
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
      
      analysisJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse layout analysis JSON:', parseError);
      console.error('Content was:', content);
      throw new Error('Failed to parse layout analysis');
    }

    // Generate grid overlay if not provided
    if (!analysisJson.gridOverlay) {
      analysisJson.gridOverlay = generateGridOverlay(analysisJson);
    }

    console.log('Layout analysis complete:', JSON.stringify(analysisJson).substring(0, 500));

    return new Response(JSON.stringify({ 
      analysis: analysisJson,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('analyze-layout error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateGridOverlay(analysis: LayoutAnalysis): string {
  const width = 40;
  const height = 20;
  const grid: string[][] = [];
  
  // Initialize grid
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1) {
        grid[y][x] = '─';
      } else if (x === 0 || x === width - 1) {
        grid[y][x] = '│';
      } else {
        grid[y][x] = ' ';
      }
    }
  }
  
  // Corners
  grid[0][0] = '┌';
  grid[0][width - 1] = '┐';
  grid[height - 1][0] = '└';
  grid[height - 1][width - 1] = '┘';
  
  // Add wall labels
  const northLabel = 'NORTH';
  const southLabel = 'SOUTH';
  for (let i = 0; i < northLabel.length; i++) {
    const x = Math.floor(width / 2) - Math.floor(northLabel.length / 2) + i;
    if (x > 0 && x < width - 1) grid[0][x] = northLabel[i];
  }
  
  // Mark windows on north wall
  for (const win of analysis.windows.filter(w => w.wall === 'north')) {
    const startX = Math.floor((win.positionPercent / 100) * (width - 2)) + 1;
    const winWidth = Math.max(2, Math.floor((win.widthPercent / 100) * (width - 2)));
    for (let i = 0; i < winWidth && startX + i < width - 1; i++) {
      grid[0][startX + i] = '▢';
    }
  }
  
  // Mark furniture zones
  for (const zone of analysis.furnitureZones) {
    const xStart = Math.floor((zone.xStart / 100) * (width - 2)) + 1;
    const xEnd = Math.floor((zone.xEnd / 100) * (width - 2)) + 1;
    const yStart = Math.floor((zone.yStart / 100) * (height - 2)) + 1;
    const yEnd = Math.floor((zone.yEnd / 100) * (height - 2)) + 1;
    
    // Place zone label in center
    const centerX = Math.floor((xStart + xEnd) / 2);
    const centerY = Math.floor((yStart + yEnd) / 2);
    const label = zone.label.substring(0, 8);
    
    for (let i = 0; i < label.length && centerX + i < width - 1; i++) {
      if (centerY > 0 && centerY < height - 1) {
        grid[centerY][centerX + i] = label[i];
      }
    }
  }
  
  return grid.map(row => row.join('')).join('\n');
}
