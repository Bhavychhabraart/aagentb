# Plan: Add AI Analysis Preview Before Zone Generation

## Overview

Currently, the zone analysis (Stage 1 with Gemini 2.5 Pro) happens inside the edge function without the user seeing the results. This makes debugging difficult and doesn't allow users to verify what the AI detected before generation.

**Solution**: Split the flow into two steps in the UI:
1. **Analyze Zone** - Call a dedicated endpoint that returns the detected furniture, positions, and scene description
2. **Generate Render** - Uses the analysis to generate the isometric view (only enabled after analysis)

This allows users to see and verify the analysis before proceeding with generation.

---

## Architecture Change

```
CURRENT FLOW (Hidden Analysis):
  User clicks "Generate" -> [Analysis + Generation combined] -> Result
  (user can't see what was detected)

NEW FLOW (Analysis Preview):
  Step 1: User clicks "Analyze Zone"
  Step 2: Show detected items in preview panel
  Step 3: User reviews and optionally re-analyzes
  Step 4: User clicks "Generate Isometric View"
  Step 5: Generation uses the verified analysis (skips re-analysis)
```

---

## UI Design for Analysis Preview

After clicking "Analyze Zone", the right panel will show:

```
+----------------------------------------------------------+
|  AI ANALYSIS RESULTS                        [Re-Analyze] |
+----------------------------------------------------------+
|  Zone Type: Living Area                                  |
|  Dimensions: ~15ft x 12ft                                |
+----------------------------------------------------------+
|  DETECTED FURNITURE (5 items):                           |
|  +------------------------------------------------------+|
|  | 1. SOFA                                              ||
|  |    Position: (35%, 50%) | Size: 40% x 15%            ||
|  |    Rotation: 0 deg | Facing: East                    ||
|  +------------------------------------------------------+|
|  | 2. COFFEE TABLE                                      ||
|  |    Position: (50%, 55%) | Size: 15% x 8%             ||
|  |    Rotation: 0 deg                                   ||
|  +------------------------------------------------------+|
|  | 3. ARMCHAIR                                          ||
|  |    Position: (20%, 45%) | Size: 12% x 12%            ||
|  |    Rotation: 45 deg | Facing: Center                 ||
|  +------------------------------------------------------+|
+----------------------------------------------------------+
|  ARCHITECTURAL FEATURES:                                 |
|  - Window on top wall (40-70%)                          |
|  - Door on right wall (80-95%)                          |
+----------------------------------------------------------+
|  SPATIAL RELATIONSHIPS:                                  |
|  - Sofa faces the window on top wall                    |
|  - Coffee table centered in front of sofa               |
|  - Armchairs flank the sofa on both sides               |
+----------------------------------------------------------+
|  SCENE DESCRIPTION:                                      |
|  "A cozy living area with a large 3-seater sofa         |
|   positioned against the left wall, facing a window..."  |
+----------------------------------------------------------+
|                                                          |
|  [============ Generate Isometric View =============]    |
|                                                          |
+----------------------------------------------------------+
```

---

## Implementation Details

### Part 1: Create Dedicated analyze-zone Edge Function

**New File**: `supabase/functions/analyze-zone/index.ts`

This function ONLY performs analysis and returns structured JSON:

**Request**:
```typescript
interface AnalyzeZoneRequest {
  layoutZoneBase64: string;  // Cropped zone image (base64 or URL)
}
```

**Response**:
```typescript
interface ZoneAnalysis {
  zoneType: string;
  estimatedDimensions: {
    widthFeet: number;
    depthFeet: number;
    aspectRatio: string;
  };
  furniture: Array<{
    type: string;
    shape: string;
    centerX: number;
    centerY: number;
    widthPercent: number;
    heightPercent: number;
    rotationDegrees: number;
    facingDirection: string;
    estimatedRealSize: string;
  }>;
  architecturalFeatures: Array<{
    type: string;
    wall: string;
    positionPercent: number;
    widthPercent: number;
  }>;
  spatialRelationships: string[];
  sceneDescription: string;
}
```

Uses Gemini 2.5 Pro for vision analysis with the same prompt currently in edit-render.

---

### Part 2: Update ZonePreviewConfirm Modal

**File**: `src/components/canvas/ZonePreviewConfirm.tsx`

Add new state for analysis:

```typescript
// New state
const [analysisResult, setAnalysisResult] = useState<ZoneAnalysis | null>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [analysisError, setAnalysisError] = useState<string | null>(null);
```

Add new function to trigger analysis:

```typescript
const handleAnalyzeZone = async () => {
  if (!previewUrl) return;
  
  setIsAnalyzing(true);
  setAnalysisError(null);
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-zone`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ layoutZoneBase64: previewUrl }),
      }
    );
    
    if (!response.ok) throw new Error('Analysis failed');
    
    const analysis = await response.json();
    setAnalysisResult(analysis);
  } catch (err) {
    setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
  } finally {
    setIsAnalyzing(false);
  }
};
```

Add new UI section for analysis results (in the right panel, before generate button):

- Analysis header with zone type and dimensions
- Scrollable list of detected furniture items with positions
- Architectural features list
- Spatial relationships list
- Scene description in italic blockquote style
- Re-analyze button if results seem wrong

Update confirm handler to pass analysis:

```typescript
const handleConfirm = () => {
  onConfirm({
    viewType: 'isometric',
    styleRefUrls,
    selectedProducts,
    customPrompt,
    preAnalysis: analysisResult,  // NEW: Pass the analysis
  });
};
```

Disable "Generate" button until analysis is complete.

---

### Part 3: Update ZoneGenerationOptions Interface

**File**: `src/components/canvas/ZonePreviewConfirm.tsx` (type definition)

Add preAnalysis to the options:

```typescript
export interface ZoneGenerationOptions {
  viewType: ViewType;
  styleRefUrls: string[];
  selectedProducts: CatalogFurnitureItem[];
  customPrompt: string;
  preAnalysis?: ZoneAnalysis;  // NEW: Optional pre-computed analysis
}
```

---

### Part 4: Update Index.tsx to Pass Analysis

**File**: `src/pages/Index.tsx`

Update `handleGenerateZoneView` to include preAnalysis in the request body:

```typescript
body: JSON.stringify({
  // ... existing fields ...
  preAnalysis: options.preAnalysis,  // Pass analysis to skip Stage 1
}),
```

---

### Part 5: Update edit-render to Accept Pre-Analysis

**File**: `supabase/functions/edit-render/index.ts`

At the start of the layout-based zone generation section, check for preAnalysis:

```typescript
// Check if analysis was already done on frontend
let zoneAnalysis = preAnalysis;

if (!zoneAnalysis && layoutBasedZone && layoutZoneBase64) {
  // Only run Stage 1 if no pre-analysis provided
  console.log('=== STAGE 1: ZONE ANALYSIS WITH GEMINI 2.5 PRO ===');
  // ... existing analysis code ...
} else if (preAnalysis) {
  console.log('=== USING PRE-ANALYZED DATA FROM FRONTEND ===');
  console.log('Zone type:', preAnalysis.zoneType);
  console.log('Furniture count:', preAnalysis.furniture?.length);
}

// Continue with Stage 2 and 3 using zoneAnalysis...
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/analyze-zone/index.ts` | **CREATE** | New edge function for zone analysis only |
| `src/components/canvas/ZonePreviewConfirm.tsx` | **MODIFY** | Add analysis state, UI, and button flow |
| `src/pages/Index.tsx` | **MODIFY** | Pass preAnalysis in generation request |
| `supabase/functions/edit-render/index.ts` | **MODIFY** | Accept and use preAnalysis if provided |

---

## User Flow After Implementation

1. User draws zone on layout
2. Full-screen modal opens with cropped preview
3. **NEW**: User clicks "Analyze Zone" button
4. Loading spinner shows "Analyzing floor plan..."
5. **NEW**: Analysis results appear showing all detected furniture with positions
6. **NEW**: User reviews the analysis (can see exactly what AI detected)
7. **NEW**: User can click "Re-analyze" if results seem wrong
8. User clicks "Generate Isometric View" (now enabled)
9. Generation proceeds using the verified analysis (skips re-analysis)
10. Result appears with accurate furniture placement

---

## Benefits

1. **Transparency**: Users see exactly what the AI detected before generation
2. **Debugging**: If generation is wrong, can check if analysis was correct first
3. **Control**: Users can re-analyze before wasting generation credits
4. **Trust**: Building user confidence by showing AI's understanding
5. **Efficiency**: Skip re-analysis during generation (already done)
6. **Faster Iteration**: If analysis is wrong, fix it before expensive generation

---

## Critical Files for Implementation

- `supabase/functions/analyze-zone/index.ts` - New edge function for dedicated zone analysis
- `src/components/canvas/ZonePreviewConfirm.tsx` - Add analysis preview UI and state management
- `src/pages/Index.tsx` - Update ZoneGenerationOptions interface and pass preAnalysis
- `supabase/functions/edit-render/index.ts` - Accept preAnalysis and skip Stage 1 when provided
