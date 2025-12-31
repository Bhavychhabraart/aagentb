import { useState, useRef, useCallback, useEffect } from 'react';
import { Pentagon, X, Check, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  getContainedImageBounds, 
  pixelToImagePercentage,
  imagePercentageToPixel,
  type ImageBounds 
} from '@/utils/imageContainBounds';

export interface PolygonPoint {
  x: number;  // Percentage (0-100)
  y: number;  // Percentage (0-100)
}

export interface Zone {
  id: string;
  name: string;
  polygon_points: PolygonPoint[];
  x_start: number;  // Bounding box min x
  y_start: number;  // Bounding box min y
  x_end: number;    // Bounding box max x
  y_end: number;    // Bounding box max y
  camera_position?: string;
}

interface ZoneSelectorProps {
  imageUrl: string;
  zones: Zone[];
  onZoneCreate: (zone: Omit<Zone, 'id'>) => void;
  onZoneDelete: (zoneId: string) => void;
  onZoneSelect: (zone: Zone) => void;
  selectedZoneId: string | null;
  isDrawing: boolean;
  onDrawingChange: (drawing: boolean) => void;
}

export function ZoneSelector({
  imageUrl,
  zones,
  onZoneCreate,
  onZoneDelete,
  onZoneSelect,
  selectedZoneId,
  isDrawing,
  onDrawingChange,
}: ZoneSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<PolygonPoint[] | null>(null);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);

  // Calculate actual image bounds
  const calculateBounds = useCallback(() => {
    if (!containerRef.current || !imgRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return;
    
    const bounds = getContainedImageBounds(
      containerRect.width,
      containerRect.height,
      naturalWidth,
      naturalHeight
    );
    setImageBounds(bounds);
  }, []);

  // Set up ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver(calculateBounds);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [calculateBounds]);

  // Reset polygon when drawing mode ends
  useEffect(() => {
    if (!isDrawing) {
      setPolygonPoints([]);
      setCursorPos(null);
    }
  }, [isDrawing]);

  const getPercentageCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageBounds) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    return pixelToImagePercentage(clientX, clientY, rect, imageBounds);
  }, [imageBounds]);

  const percentToPixel = useCallback((point: PolygonPoint) => {
    if (!imageBounds) return { x: 0, y: 0 };
    return imagePercentageToPixel(point.x, point.y, imageBounds);
  }, [imageBounds]);

  // Check if cursor is near the first point (to close polygon)
  const isNearFirstPoint = useCallback((cursorX: number, cursorY: number): boolean => {
    if (polygonPoints.length < 3 || !imageBounds) return false;
    
    const firstPixel = percentToPixel(polygonPoints[0]);
    const distance = Math.sqrt(
      Math.pow(cursorX - firstPixel.x, 2) + 
      Math.pow(cursorY - firstPixel.y, 2)
    );
    return distance < 15; // 15px threshold
  }, [polygonPoints, imageBounds, percentToPixel]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageBounds) return;
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (!coords) return; // Click was in letterbox area
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;
    
    // Check if clicking near first point to close polygon
    if (isNearFirstPoint(pixelX, pixelY)) {
      completePolygon();
      return;
    }
    
    setPolygonPoints(prev => [...prev, coords]);
  }, [isDrawing, imageBounds, getPercentageCoords, isNearFirstPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageBounds) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [isDrawing, imageBounds]);

  const completePolygon = useCallback(() => {
    if (polygonPoints.length < 3) return;
    
    setPendingPolygon(polygonPoints);
    setShowNameInput(true);
    setNewZoneName(`Zone ${zones.length + 1}`);
    setPolygonPoints([]);
    onDrawingChange(false);
  }, [polygonPoints, zones.length, onDrawingChange]);

  const handleUndo = useCallback(() => {
    setPolygonPoints(prev => prev.slice(0, -1));
  }, []);

  const handleCancel = useCallback(() => {
    setPolygonPoints([]);
    onDrawingChange(false);
  }, [onDrawingChange]);

  const handleConfirmZone = () => {
    if (pendingPolygon && pendingPolygon.length >= 3 && newZoneName.trim()) {
      // Calculate bounding box
      const x_start = Math.min(...pendingPolygon.map(p => p.x));
      const y_start = Math.min(...pendingPolygon.map(p => p.y));
      const x_end = Math.max(...pendingPolygon.map(p => p.x));
      const y_end = Math.max(...pendingPolygon.map(p => p.y));
      
      onZoneCreate({
        name: newZoneName.trim(),
        polygon_points: pendingPolygon,
        x_start,
        y_start,
        x_end,
        y_end,
      });
      setPendingPolygon(null);
      setShowNameInput(false);
      setNewZoneName('');
    }
  };

  const handleCancelZone = () => {
    setPendingPolygon(null);
    setShowNameInput(false);
    setNewZoneName('');
  };

  // Build SVG points string for a polygon
  const getPolygonSvgPoints = useCallback((points: PolygonPoint[]): string => {
    return points.map(p => {
      const pixel = percentToPixel(p);
      return `${pixel.x},${pixel.y}`;
    }).join(' ');
  }, [percentToPixel]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full overflow-hidden rounded-lg",
          isDrawing && "cursor-crosshair"
        )}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Room render"
          className="w-full h-full object-contain"
          draggable={false}
          onLoad={calculateBounds}
        />

        {/* SVG overlay for zones */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full">
          {/* Existing zones */}
          {zones.map((zone) => {
            if (!zone.polygon_points || zone.polygon_points.length < 3) return null;
            
            return (
              <polygon
                key={zone.id}
                points={getPolygonSvgPoints(zone.polygon_points)}
                className={cn(
                  "transition-all cursor-pointer pointer-events-auto",
                  selectedZoneId === zone.id
                    ? "fill-primary/20 stroke-primary"
                    : "fill-amber-500/10 stroke-amber-500/70 hover:fill-amber-500/20 hover:stroke-amber-400"
                )}
                strokeWidth="2"
                onClick={(e) => {
                  e.stopPropagation();
                  onZoneSelect(zone);
                }}
              />
            );
          })}

          {/* Pending polygon being named */}
          {pendingPolygon && pendingPolygon.length >= 3 && (
            <polygon
              points={getPolygonSvgPoints(pendingPolygon)}
              className="fill-green-500/20 stroke-green-500"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}

          {/* Current drawing polygon */}
          {isDrawing && polygonPoints.length > 0 && (
            <>
              {/* Lines connecting points */}
              <polyline
                points={[
                  getPolygonSvgPoints(polygonPoints),
                  cursorPos ? `${cursorPos.x},${cursorPos.y}` : ''
                ].filter(Boolean).join(' ')}
                className="fill-none stroke-primary"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              
              {/* Fill preview when 3+ points */}
              {polygonPoints.length >= 3 && (
                <polygon
                  points={getPolygonSvgPoints(polygonPoints)}
                  className="fill-primary/10 stroke-none"
                />
              )}
              
              {/* Point handles */}
              {polygonPoints.map((p, i) => {
                const pixel = percentToPixel(p);
                const isFirst = i === 0;
                const canClose = isFirst && polygonPoints.length >= 3;
                
                return (
                  <circle
                    key={i}
                    cx={pixel.x}
                    cy={pixel.y}
                    r={canClose ? 8 : 5}
                    className={cn(
                      "transition-all",
                      isFirst 
                        ? "fill-green-500 stroke-green-300" 
                        : "fill-primary stroke-primary-foreground"
                    )}
                    strokeWidth="2"
                  />
                );
              })}

              {/* Cursor indicator for closing */}
              {cursorPos && isNearFirstPoint(cursorPos.x, cursorPos.y) && (
                <circle
                  cx={percentToPixel(polygonPoints[0]).x}
                  cy={percentToPixel(polygonPoints[0]).y}
                  r={12}
                  className="fill-none stroke-green-400 animate-pulse"
                  strokeWidth="2"
                />
              )}
            </>
          )}
        </svg>

        {/* Zone labels and delete buttons (positioned separately) */}
        {zones.map((zone) => {
          if (!zone.polygon_points || zone.polygon_points.length < 3) return null;
          
          // Position label at top-left of bounding box
          const labelPos = percentToPixel({ x: zone.x_start, y: zone.y_start });
          
          return (
            <div
              key={`label-${zone.id}`}
              className="absolute pointer-events-auto group"
              style={{
                left: labelPos.x,
                top: labelPos.y,
                transform: 'translate(4px, 4px)',
              }}
            >
              <div className="px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                {zone.name}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-6 h-5 w-5 bg-black/70 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onZoneDelete(zone.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Zone name input modal */}
      {showNameInput && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-card p-4 rounded-lg border border-border shadow-xl max-w-xs w-full mx-4">
            <h3 className="text-sm font-semibold mb-3">Name this zone</h3>
            <Input
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="e.g., Living Area, Kitchen Corner"
              className="mb-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmZone();
                if (e.key === 'Escape') handleCancelZone();
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCancelZone}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleConfirmZone}>
                <Check className="h-4 w-4 mr-1" />
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawing mode controls */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-md rounded-lg border border-border/50">
            <Pentagon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              {polygonPoints.length === 0 
                ? "Click to add points" 
                : polygonPoints.length < 3 
                  ? `${3 - polygonPoints.length} more point${3 - polygonPoints.length > 1 ? 's' : ''} needed`
                  : "Click first point or 'Close' to finish"}
            </span>
            
            <div className="h-4 w-px bg-border mx-1" />
            
            {polygonPoints.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={handleUndo}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo
              </Button>
            )}
            
            {polygonPoints.length >= 3 && (
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={completePolygon}
              >
                <Check className="h-3 w-3 mr-1" />
                Close
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-destructive hover:text-destructive"
              onClick={handleCancel}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
