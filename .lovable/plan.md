# Plan: Two-Stage Zone Generation with Gemini 2.5 Analysis

## Problem
Zone generation produces inaccurate results because the image generation model is receiving generic prompts that don't precisely describe what's in the cropped zone. The AI has to interpret the floor plan AND generate the image simultaneously, leading to errors.

## Solution: Two-Stage Analysis → Generation Pipeline

Use Gemini 2.5 Pro (text/vision) to first ANALYZE the cropped zone in detail, then craft a precise, structured prompt that Gemini 3 Pro Image uses to generate the isometric render.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                TWO-STAGE ZONE GENERATION PIPELINE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STAGE 1: ZONE ANALYSIS (Gemini 2.5 Pro - Text/Vision)                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Input: Cropped 2D zone layout image                            │   │
│  │                                                                  │   │
│  │  Output: Detailed JSON analysis                                  │   │
│  │  • Exact furniture items with positions (% coordinates)         │   │
│  │  • Furniture sizes and orientations                              │   │
│  │  • Wall features (windows, doors)                                │   │
│  │  • Room dimensions and proportions                               │   │
│  │  • Spatial relationships between items                           │   │
│  │  • Natural language scene description                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  STAGE 2: PROMPT CRAFTING                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Combine:                                                        │   │
│  │  • Analysis JSON → Structured placement instructions             │   │
│  │  • Style references → Aesthetic directives                       │   │
│  │  • Product images → Specific product requirements                │   │
│  │  • User prompt → Additional customization                        │   │
│  │                                                                  │   │
│  │  Output: Highly detailed, pixel-precise generation prompt        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  STAGE 3: IMAGE GENERATION (Gemini 3 Pro Image)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Input: Precise prompt + zone image + style refs + products     │   │
│  │                                                                  │   │
│  │  Output: Accurate isometric 3D render                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Part 1: Create New Zone Analysis Function

**New File**: `supabase/functions/analyze-zone/index.ts`

This function specifically analyzes a cropped zone image and returns:

```typescript
interface ZoneAnalysis {
  // Room structure
  zoneType: string; // "living_area", "dining_area", "bedroom", etc.
  dimensions: {
    widthFeet: number;
    depthFeet: number;
    aspectRatio: string;
  };
  
  // Wall features visible in zone
  walls: {
    direction: 'north' | 'south' | 'east' | 'west';
    hasWindow: boolean;
    hasDoor: boolean;
    windowPosition?: number; // 0-100%
    doorPosition?: number;
  }[];
  
  // CRITICAL: Precise furniture catalog
  furniture: {
    type: string; // "sofa", "coffee_table", "armchair", etc.
    shape: 'rectangular' | 'circular' | 'L-shaped' | 'irregular';
    centerX: number; // 0-100% from left
    centerY: number; // 0-100% from top
    widthPercent: number;
    heightPercent: number;
    rotationDegrees: number; // 0, 90, 180, 270
    facingDirection: string;
    estimatedSize: string; // "7ft sofa", "4ft round table"
  }[];
  
  // Natural language description for image gen
  sceneDescription: string;
  
  // Spatial relationships
  relationships: string[]; // "sofa faces window", "coffee table centered in front of sofa"
  
  // Lighting analysis
  lighting: {
    primarySource: string;
    direction: string;
    mood: string;
  };
}
```

**Prompt for Zone Analysis**:
```
You are a precision floor plan analyzer specializing in 2D-to-3D translation.
Analyze this CROPPED ZONE from a floor plan with PIXEL-PERFECT accuracy.

Your analysis will be used to generate an isometric 3D render, so EVERY detail matters.

OUTPUT FORMAT: JSON object with:

1. FURNITURE INVENTORY (Critical - must list EVERY piece):
   - Type (be specific: "3-seater sofa", "round coffee table", "floor lamp")
   - Exact center position (X%, Y% from top-left)
   - Size as percentage of zone width/height
   - Rotation (0°, 45°, 90°, 135°, 180°, etc.)
   - Facing direction

2. SPATIAL RELATIONSHIPS:
   - What faces what
   - What is next to what
   - Distance relationships ("table is 2ft from sofa")

3. WALL FEATURES:
   - Windows (position, size, type)
   - Doors (position, swing direction)
   - Built-ins

4. SCENE DESCRIPTION:
   Write a detailed paragraph describing this space as if describing it to a 3D artist
   who cannot see the image. Include every furniture piece, its exact position,
   and the overall layout.

Be EXTREMELY precise - this data controls exact 3D placement.
```

---

### Part 2: Update edit-render Edge Function

**File**: `supabase/functions/edit-render/index.ts`

Add Stage 1 analysis before generation:

```typescript
// STAGE 1: Analyze the zone with Gemini 2.5 Pro
console.log('STAGE 1: Analyzing zone with Gemini 2.5 Pro...');

const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-pro', // Best for analysis
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: layoutZoneBase64 } },
          { type: 'text', text: ZONE_ANALYSIS_PROMPT }
        ]
      }
    ],
  }),
});

const analysisData = await analysisResponse.json();
const zoneAnalysis = JSON.parse(analysisData.choices[0].message.content);

console.log('Zone analysis complete:', zoneAnalysis);

// STAGE 2: Craft precise prompt from analysis
const precisePrompt = buildPrecisePromptFromAnalysis(zoneAnalysis, {
  styleRefs: styleRefUrls,
  products: furnitureItems,
  userPrompt,
});

// STAGE 3: Generate with Gemini 3 Pro Image using precise prompt
```

**New Function: buildPrecisePromptFromAnalysis**:

```typescript
function buildPrecisePromptFromAnalysis(
  analysis: ZoneAnalysis,
  options: { styleRefs?: string[]; products?: FurnitureItem[]; userPrompt?: string }
): string {
  let prompt = `CREATE AN ISOMETRIC 3D RENDER with the following EXACT specifications:

ROOM DIMENSIONS: ${analysis.dimensions.widthFeet}ft × ${analysis.dimensions.depthFeet}ft
ASPECT RATIO: ${analysis.dimensions.aspectRatio}

════════════════════════════════════════════════════
                 FURNITURE PLACEMENT (EXACT)
════════════════════════════════════════════════════
`;

  // Add each furniture item with precise coordinates
  analysis.furniture.forEach((item, index) => {
    prompt += `
${index + 1}. ${item.type.toUpperCase()}
   • Position: ${item.centerX}% from left, ${item.centerY}% from top
   • Size: ${item.widthPercent}% × ${item.heightPercent}% of zone
   • Rotation: ${item.rotationDegrees}° (facing ${item.facingDirection})
   • Real-world size: ${item.estimatedSize}
`;
  });

  prompt += `
════════════════════════════════════════════════════
                 SPATIAL RELATIONSHIPS
════════════════════════════════════════════════════
${analysis.relationships.join('\n')}

════════════════════════════════════════════════════
                 SCENE DESCRIPTION
════════════════════════════════════════════════════
${analysis.sceneDescription}

════════════════════════════════════════════════════
                 CAMERA & RENDERING
════════════════════════════════════════════════════
• ISOMETRIC VIEW: 30-45° elevation, 45° rotation from corner
• NO perspective distortion - parallel lines stay parallel
• Photorealistic quality (RED Cinema Camera / Architectural Digest)
• Natural lighting from ${analysis.lighting.direction}
• ${analysis.lighting.mood} atmosphere

${options.userPrompt || ''}
`;

  return prompt;
}
```

---

### Part 3: Update Frontend Flow

**File**: `src/pages/Index.tsx`

Update `handleGenerateZoneView` to show analysis progress:

```typescript
const handleGenerateZoneView = async (zone: Zone, options: ZoneGenerationOptions) => {
  setIsGenerating(true);
  setGenerationStatus('Analyzing zone layout...'); // NEW: Show analysis step
  
  try {
    // The edge function now handles both analysis and generation
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
      // ... existing code ...
    });
    
    // The response will include analysis data for debugging
    const data = await response.json();
    
    if (data.analysis) {
      console.log('Zone analysis:', data.analysis);
    }
    
    // ... rest of handling ...
  } finally {
    setIsGenerating(false);
    setGenerationStatus(null);
  }
};
```

**File**: `src/components/canvas/ZonePreviewConfirm.tsx`

Add analysis preview/status:

```typescript
// Show what the AI detected during generation
{isGenerating && (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">
        {analysisComplete ? 'Generating isometric render...' : 'Analyzing zone layout...'}
      </span>
    </div>
    {analysisComplete && analysisData && (
      <div className="text-xs bg-muted/50 p-2 rounded max-h-32 overflow-y-auto">
        <p className="font-medium mb-1">Detected {analysisData.furniture.length} furniture items:</p>
        <ul className="list-disc list-inside">
          {analysisData.furniture.map((item, i) => (
            <li key={i}>{item.type} at ({item.centerX}%, {item.centerY}%)</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/analyze-zone/index.ts` | **NEW** - Dedicated zone analysis function |
| `supabase/functions/edit-render/index.ts` | Add two-stage pipeline with analysis → generation |
| `src/pages/Index.tsx` | Update handler to support analysis status |
| `src/components/canvas/ZonePreviewConfirm.tsx` | Show analysis progress and detected items |
| `supabase/config.toml` | Add new analyze-zone function |

---

## Benefits of Two-Stage Approach

1. **Accuracy**: Gemini 2.5 Pro excels at image analysis and can extract precise coordinates
2. **Explainability**: Can show users what the AI detected before generation
3. **Debugging**: If generation is wrong, can check if analysis was correct
4. **Consistency**: Same analysis → same generation (more reproducible)
5. **Prompt Quality**: Human-readable, structured prompts instead of hoping the image model understands

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Furniture count accuracy | ~60% | ~95% |
| Position accuracy | ~50% | ~90% |
| Relative spacing | Poor | Excellent |
| Reproducibility | Low | High |
| Debug visibility | None | Full analysis JSON |

---

## Critical Files for Implementation

- `supabase/functions/edit-render/index.ts` - Add two-stage pipeline with Gemini 2.5 analysis
- `supabase/functions/analyze-zone/index.ts` - New dedicated zone analysis function  
- `src/components/canvas/ZonePreviewConfirm.tsx` - Show analysis progress UI
- `src/pages/Index.tsx` - Update generation handler for analysis status
- `supabase/config.toml` - Register new analyze-zone function
