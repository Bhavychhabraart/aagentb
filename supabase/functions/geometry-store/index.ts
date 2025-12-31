import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Geometry data structures - these become IMMUTABLE once stored
interface CameraMatrix {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  fov: number;
  aspectRatio: string;
  viewType: 'isometric' | 'perspective' | 'orthographic';
}

interface WallNormal {
  wall: 'north' | 'south' | 'east' | 'west';
  normal: { x: number; y: number; z: number };
  length: number;
}

interface FurnitureAnchor {
  id: string;
  name: string;
  position: { x: number; y: number }; // Percentage 0-100
  rotation: number; // Degrees
  boundingBox: { width: number; height: number }; // Percentage of room
  allowedCategories: string[];
  occupied: boolean;
  occupiedBy?: string;
}

interface GeometryData {
  roomShape: string;
  dimensions: { width: number; depth: number; height: number; unit: string };
  aspectRatio: string;
  walls: Array<{
    position: string;
    length: number;
    features: Array<{ type: string; positionPercent: number; widthPercent: number }>;
  }>;
  windows: Array<{
    id: string;
    wall: string;
    positionPercent: number;
    widthPercent: number;
    heightPercent: number;
    type: string;
  }>;
  doors: Array<{
    id: string;
    wall: string;
    positionPercent: number;
    widthPercent: number;
    type: string;
    swingDirection: string;
  }>;
  furnitureZones: Array<{
    name: string;
    label: string;
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
    suggestedItems: string[];
  }>;
}

interface FloorPolygonPoint {
  x: number;
  y: number;
}

interface StoredGeometry {
  id: string;
  project_id: string;
  room_id: string | null;
  layout_hash: string;
  geometry_data: GeometryData;
  camera_matrix: CameraMatrix;
  floor_polygon: FloorPolygonPoint[];
  wall_normals: Record<string, WallNormal>;
  furniture_anchors: FurnitureAnchor[];
  control_signals: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Generate a hash from layout image URL for deduplication
function generateLayoutHash(layoutUrl: string): string {
  // Simple hash based on URL - in production you might want content-based hashing
  let hash = 0;
  for (let i = 0; i < layoutUrl.length; i++) {
    const char = layoutUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Convert layout analysis to camera matrix
function buildCameraMatrix(analysis: GeometryData): CameraMatrix {
  // Calculate isometric camera position based on room dimensions
  const { width, depth } = analysis.dimensions;
  const roomDiagonal = Math.sqrt(width * width + depth * depth);
  
  return {
    position: {
      x: width * 0.8, // Southeast corner
      y: depth * 0.8,
      z: roomDiagonal * 0.6, // Elevated position
    },
    rotation: {
      pitch: -45, // Looking down at 45 degrees
      yaw: 225, // Looking northwest
      roll: 0,
    },
    fov: 60,
    aspectRatio: '16:9',
    viewType: 'isometric',
  };
}

// Calculate wall normals for each wall
function calculateWallNormals(analysis: GeometryData): Record<string, WallNormal> {
  const normals: Record<string, WallNormal> = {};
  
  for (const wall of analysis.walls) {
    let normal: { x: number; y: number; z: number };
    
    switch (wall.position) {
      case 'north':
        normal = { x: 0, y: 1, z: 0 };
        break;
      case 'south':
        normal = { x: 0, y: -1, z: 0 };
        break;
      case 'east':
        normal = { x: -1, y: 0, z: 0 };
        break;
      case 'west':
        normal = { x: 1, y: 0, z: 0 };
        break;
      default:
        normal = { x: 0, y: 0, z: 1 };
    }
    
    normals[wall.position] = {
      wall: wall.position as 'north' | 'south' | 'east' | 'west',
      normal,
      length: wall.length,
    };
  }
  
  return normals;
}

// Generate floor polygon from room dimensions
function generateFloorPolygon(analysis: GeometryData): FloorPolygonPoint[] {
  const { width, depth } = analysis.dimensions;
  
  // Simple rectangular floor for now
  // For L-shaped rooms, this would be more complex
  if (analysis.roomShape === 'rectangular' || analysis.roomShape === 'square') {
    return [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: depth },
      { x: 0, y: depth },
    ];
  }
  
  // For L-shaped, create 6-point polygon
  if (analysis.roomShape === 'L-shaped') {
    const halfWidth = width * 0.6;
    const halfDepth = depth * 0.6;
    return [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: halfDepth },
      { x: halfWidth, y: halfDepth },
      { x: halfWidth, y: depth },
      { x: 0, y: depth },
    ];
  }
  
  // Default rectangular
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: depth },
    { x: 0, y: depth },
  ];
}

// Convert furniture zones to anchors
function generateFurnitureAnchors(analysis: GeometryData): FurnitureAnchor[] {
  const anchors: FurnitureAnchor[] = [];
  
  for (const zone of analysis.furnitureZones) {
    // Create anchor at zone center
    const centerX = (zone.xStart + zone.xEnd) / 2;
    const centerY = (zone.yStart + zone.yEnd) / 2;
    const width = zone.xEnd - zone.xStart;
    const height = zone.yEnd - zone.yStart;
    
    anchors.push({
      id: `anchor_${zone.name}`,
      name: zone.label,
      position: { x: centerX, y: centerY },
      rotation: 0,
      boundingBox: { width, height },
      allowedCategories: zone.suggestedItems,
      occupied: false,
    });
  }
  
  return anchors;
}

// Add unique IDs to windows and doors if missing
function normalizeGeometry(analysis: GeometryData): GeometryData {
  const normalized = { ...analysis };
  
  // Add IDs to windows
  normalized.windows = analysis.windows?.map((w, i) => ({
    ...w,
    id: `window_${w.wall}_${i}`,
  })) || [];
  
  // Add IDs to doors
  normalized.doors = analysis.doors?.map((d, i) => ({
    ...d,
    id: `door_${d.wall}_${i}`,
  })) || [];
  
  return normalized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, layoutImageUrl, layoutAnalysis, projectId, roomId, userId, geometryId } = await req.json();

    console.log('Geometry store action:', action);

    // GET: Retrieve existing geometry
    if (action === 'get') {
      if (geometryId) {
        const { data, error } = await supabase
          .from('room_geometry')
          .select('*')
          .eq('id', geometryId)
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ geometry: data, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (layoutImageUrl) {
        const hash = generateLayoutHash(layoutImageUrl);
        const { data, error } = await supabase
          .from('room_geometry')
          .select('*')
          .eq('layout_hash', hash)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          return new Response(JSON.stringify({ geometry: data, cached: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      return new Response(JSON.stringify({ geometry: null, cached: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STORE: Create new geometry from layout analysis
    if (action === 'store') {
      if (!layoutAnalysis || !layoutImageUrl || !userId) {
        throw new Error('layoutAnalysis, layoutImageUrl, and userId are required for store action');
      }

      const hash = generateLayoutHash(layoutImageUrl);
      const normalizedGeometry = normalizeGeometry(layoutAnalysis);
      const cameraMatrix = buildCameraMatrix(normalizedGeometry);
      const wallNormals = calculateWallNormals(normalizedGeometry);
      const floorPolygon = generateFloorPolygon(normalizedGeometry);
      const furnitureAnchors = generateFurnitureAnchors(normalizedGeometry);

      // Upsert geometry (update if hash exists, insert if not)
      const { data, error } = await supabase
        .from('room_geometry')
        .upsert({
          layout_hash: hash,
          project_id: projectId || null,
          room_id: roomId || null,
          user_id: userId,
          geometry_data: normalizedGeometry,
          camera_matrix: cameraMatrix,
          floor_polygon: floorPolygon,
          wall_normals: wallNormals,
          furniture_anchors: furnitureAnchors,
          control_signals: {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'layout_hash,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Geometry stored successfully:', data.id);

      return new Response(JSON.stringify({ 
        geometry: data, 
        stored: true,
        message: 'Geometry frozen successfully. This layout data is now immutable for rendering.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE_ANCHORS: Update furniture anchor occupancy
    if (action === 'update_anchors') {
      if (!geometryId || !userId) {
        throw new Error('geometryId and userId are required for update_anchors action');
      }

      const { anchorUpdates } = await req.json();

      // Get current geometry
      const { data: current, error: fetchError } = await supabase
        .from('room_geometry')
        .select('furniture_anchors')
        .eq('id', geometryId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update anchor occupancy
      const updatedAnchors = (current.furniture_anchors as FurnitureAnchor[]).map(anchor => {
        const update = anchorUpdates?.find((u: { anchorId: string }) => u.anchorId === anchor.id);
        if (update) {
          return {
            ...anchor,
            occupied: update.occupied,
            occupiedBy: update.occupiedBy || undefined,
          };
        }
        return anchor;
      });

      const { data, error } = await supabase
        .from('room_geometry')
        .update({ 
          furniture_anchors: updatedAnchors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', geometryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ geometry: data, updated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STORE_CONTROL_SIGNALS: Store generated control signals
    if (action === 'store_control_signals') {
      if (!geometryId || !userId) {
        throw new Error('geometryId and userId are required');
      }

      const { controlSignals } = await req.json();

      const { data, error } = await supabase
        .from('room_geometry')
        .update({ 
          control_signals: controlSignals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', geometryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ geometry: data, updated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('geometry-store error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
