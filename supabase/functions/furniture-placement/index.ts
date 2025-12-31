import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Furniture placement using PURE GEOMETRY - no AI
// This ensures deterministic, collision-free placement

interface FurnitureAnchor {
  id: string;
  name: string;
  position: { x: number; y: number };
  rotation: number;
  boundingBox: { width: number; height: number };
  allowedCategories: string[];
  occupied: boolean;
  occupiedBy?: string;
}

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  dimensions?: { width: number; height: number; depth: number };
}

interface PlacementRequest {
  furnitureItem: FurnitureItem;
  targetAnchorId?: string;
  targetPosition?: { x: number; y: number };
}

interface PlacementResult {
  furnitureId: string;
  anchorId: string;
  position: { x: number; y: number };
  rotation: number;
  scale: { x: number; y: number };
  boundingBox: { 
    minX: number; maxX: number; 
    minY: number; maxY: number;
  };
  valid: boolean;
  reason?: string;
}

interface PlacementManifest {
  items: PlacementResult[];
  collisions: string[];
  warnings: string[];
  valid: boolean;
  totalItems: number;
}

// Check if two bounding boxes overlap
function checkCollision(
  box1: { minX: number; maxX: number; minY: number; maxY: number },
  box2: { minX: number; maxX: number; minY: number; maxY: number },
  padding: number = 2 // 2% padding between items
): boolean {
  return !(
    box1.maxX + padding < box2.minX ||
    box1.minX - padding > box2.maxX ||
    box1.maxY + padding < box2.minY ||
    box1.minY - padding > box2.maxY
  );
}

// Find the best anchor for a furniture item based on category
function findBestAnchor(
  item: FurnitureItem,
  anchors: FurnitureAnchor[],
  placedItems: PlacementResult[]
): FurnitureAnchor | null {
  // Filter anchors that allow this category and are not occupied
  const validAnchors = anchors.filter(anchor => {
    // Check if category is allowed
    const categoryMatch = anchor.allowedCategories.some(cat => 
      cat.toLowerCase().includes(item.category.toLowerCase()) ||
      item.category.toLowerCase().includes(cat.toLowerCase()) ||
      item.name.toLowerCase().includes(cat.toLowerCase())
    );
    
    // Check if not occupied by another item
    if (anchor.occupied) return false;
    
    // Check if placement wouldn't cause collision
    const testPlacement = calculatePlacement(item, anchor);
    const hasCollision = placedItems.some(placed => 
      checkCollision(testPlacement.boundingBox, placed.boundingBox)
    );
    
    return categoryMatch && !hasCollision;
  });
  
  if (validAnchors.length === 0) return null;
  
  // Prefer anchors that best match the item name
  const exactMatch = validAnchors.find(a => 
    a.allowedCategories.some(cat => 
      item.name.toLowerCase().includes(cat.toLowerCase())
    )
  );
  
  return exactMatch || validAnchors[0];
}

// Calculate placement for an item at a specific anchor
function calculatePlacement(
  item: FurnitureItem,
  anchor: FurnitureAnchor,
  customRotation?: number
): PlacementResult {
  const position = { ...anchor.position };
  const rotation = customRotation ?? anchor.rotation;
  
  // Scale to fit anchor bounding box if dimensions provided
  let scale = { x: 1, y: 1 };
  if (item.dimensions) {
    // Normalize dimensions to percentage of anchor space
    const widthRatio = anchor.boundingBox.width / (item.dimensions.width * 10);
    const heightRatio = anchor.boundingBox.height / (item.dimensions.depth * 10);
    const fitRatio = Math.min(widthRatio, heightRatio, 1); // Don't scale up
    scale = { x: fitRatio, y: fitRatio };
  }
  
  // Calculate bounding box based on anchor size
  const halfWidth = anchor.boundingBox.width / 2;
  const halfHeight = anchor.boundingBox.height / 2;
  
  const boundingBox = {
    minX: position.x - halfWidth,
    maxX: position.x + halfWidth,
    minY: position.y - halfHeight,
    maxY: position.y + halfHeight,
  };
  
  return {
    furnitureId: item.id,
    anchorId: anchor.id,
    position,
    rotation,
    scale,
    boundingBox,
    valid: true,
  };
}

// Calculate optimal rotation for furniture to face room center
function calculateFacingRotation(
  position: { x: number; y: number },
  roomCenter: { x: number; y: number } = { x: 50, y: 50 }
): number {
  const dx = roomCenter.x - position.x;
  const dy = roomCenter.y - position.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Round to nearest 45 degrees for cleaner placement
  return Math.round(angle / 45) * 45;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      furnitureItems, 
      anchors, 
      existingPlacements,
      placementRequests,
      roomDimensions,
    } = await req.json();

    console.log('Processing furniture placement:', {
      items: furnitureItems?.length || 0,
      anchors: anchors?.length || 0,
      existingPlacements: existingPlacements?.length || 0,
    });

    const manifest: PlacementManifest = {
      items: [],
      collisions: [],
      warnings: [],
      valid: true,
      totalItems: 0,
    };

    // Start with existing placements
    const placedItems: PlacementResult[] = existingPlacements || [];

    // Process each furniture item
    for (const item of (furnitureItems as FurnitureItem[] || [])) {
      // Check if there's a specific placement request
      const request = (placementRequests as PlacementRequest[] || [])
        .find(r => r.furnitureItem.id === item.id);
      
      let placement: PlacementResult | null = null;
      
      if (request?.targetAnchorId) {
        // Use specified anchor
        const targetAnchor = (anchors as FurnitureAnchor[])
          .find(a => a.id === request.targetAnchorId);
        
        if (targetAnchor) {
          placement = calculatePlacement(item, targetAnchor);
        } else {
          manifest.warnings.push(`Anchor ${request.targetAnchorId} not found for ${item.name}`);
        }
      } else if (request?.targetPosition) {
        // Use specified position - create virtual anchor
        const virtualAnchor: FurnitureAnchor = {
          id: `virtual_${item.id}`,
          name: 'Custom Position',
          position: request.targetPosition,
          rotation: 0,
          boundingBox: { width: 15, height: 15 }, // Default size
          allowedCategories: [item.category],
          occupied: false,
        };
        placement = calculatePlacement(item, virtualAnchor);
      } else {
        // Find best anchor automatically
        const bestAnchor = findBestAnchor(item, anchors || [], placedItems);
        
        if (bestAnchor) {
          const rotation = calculateFacingRotation(bestAnchor.position);
          placement = calculatePlacement(item, bestAnchor, rotation);
        } else {
          manifest.warnings.push(`No suitable anchor found for ${item.name} (${item.category})`);
        }
      }
      
      if (placement) {
        // Check for collisions with existing placements
        const collidingItem = placedItems.find(placed => 
          checkCollision(placement!.boundingBox, placed.boundingBox)
        );
        
        if (collidingItem) {
          manifest.collisions.push(
            `${item.name} collides with item at anchor ${collidingItem.anchorId}`
          );
          placement.valid = false;
          placement.reason = 'Collision detected';
          manifest.valid = false;
        }
        
        // Check if placement is within room bounds (0-100%)
        if (
          placement.boundingBox.minX < 0 || 
          placement.boundingBox.maxX > 100 ||
          placement.boundingBox.minY < 0 || 
          placement.boundingBox.maxY > 100
        ) {
          manifest.warnings.push(`${item.name} may extend outside room boundaries`);
        }
        
        manifest.items.push(placement);
        placedItems.push(placement);
      }
    }

    manifest.totalItems = manifest.items.length;
    
    // Final validation
    if (manifest.collisions.length > 0) {
      manifest.valid = false;
    }

    console.log('Placement manifest generated:', {
      totalItems: manifest.totalItems,
      valid: manifest.valid,
      collisions: manifest.collisions.length,
      warnings: manifest.warnings.length,
    });

    return new Response(JSON.stringify({ 
      manifest,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('furniture-placement error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
