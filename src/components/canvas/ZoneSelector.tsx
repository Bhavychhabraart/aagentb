import { useState, useRef, useCallback, useEffect } from 'react';
import { Square, X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  getContainedImageBounds, 
  pixelToImagePercentage,
  imagePercentageToPixel,
  type ImageBounds 
} from '@/utils/imageContainBounds';
import { useCameraShutter } from '@/hooks/useCameraShutter';

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
  const { playShutter } = useCameraShutter();
  
  // Rectangle drawing state
  const [dragStart, setDragStart] = useState<PolygonPoint | null>(null);
  const [dragEnd, setDragEnd] = useState<PolygonPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Zone naming
  const [newZoneName, setNewZoneName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingRect, setPendingRect] = useState<{ start: PolygonPoint; end: PolygonPoint } | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  
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

  // Reset drawing state when drawing mode ends
  useEffect(() => {
    if (!isDrawing) {
      setDragStart(null);
      setDragEnd(null);
      setIsDragging(false);
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

  // Mouse down - start rectangle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageBounds) return;
    e.preventDefault();
    
    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (!coords) return; // Click was in letterbox area
    
    setDragStart(coords);
    setDragEnd(coords);
    setIsDragging(true);
  }, [isDrawing, imageBounds, getPercentageCoords]);

  // Mouse move - update rectangle end
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageBounds || !isDragging) return;
    
    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (!coords) return;
    
    setDragEnd(coords);
  }, [isDrawing, imageBounds, isDragging, getPercentageCoords]);

  // Mouse up - complete rectangle
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isDragging || !dragStart || !dragEnd) return;
    
    // Check if rectangle is large enough (at least 2% in both dimensions)
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);
    
    if (width >= 2 && height >= 2) {
      // Play camera shutter sound and flash effect
      playShutter();
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 150);
      
      setPendingRect({ start: dragStart, end: dragEnd });
      setShowNameInput(true);
      setNewZoneName(`Zone ${zones.length + 1}`);
    }
    
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
    onDrawingChange(false);
  }, [isDrawing, isDragging, dragStart, dragEnd, zones.length, onDrawingChange]);

  // Mouse leave - cancel if dragging
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setDragStart(null);
      setDragEnd(null);
      setIsDragging(false);
    }
  }, [isDragging]);

  const handleCancel = useCallback(() => {
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
    onDrawingChange(false);
  }, [onDrawingChange]);

  const handleConfirmZone = () => {
    if (pendingRect && newZoneName.trim()) {
      // Calculate normalized bounds (ensure start < end) and CLAMP to 0-100
      const x_start = Math.max(0, Math.min(100, Math.min(pendingRect.start.x, pendingRect.end.x)));
      const y_start = Math.max(0, Math.min(100, Math.min(pendingRect.start.y, pendingRect.end.y)));
      const x_end = Math.max(0, Math.min(100, Math.max(pendingRect.start.x, pendingRect.end.x)));
      const y_end = Math.max(0, Math.min(100, Math.max(pendingRect.start.y, pendingRect.end.y)));
      
      console.log('Zone created with bounds:', { x_start, y_start, x_end, y_end });
      
      // Store as 4 corner points for backwards compatibility
      const polygon_points: PolygonPoint[] = [
        { x: x_start, y: y_start },  // top-left
        { x: x_end, y: y_start },    // top-right
        { x: x_end, y: y_end },      // bottom-right
        { x: x_start, y: y_end },    // bottom-left
      ];
      
      onZoneCreate({
        name: newZoneName.trim(),
        polygon_points,
        x_start,
        y_start,
        x_end,
        y_end,
      });
      setPendingRect(null);
      setShowNameInput(false);
      setNewZoneName('');
    }
  };

  const handleCancelZone = () => {
    setPendingRect(null);
    setShowNameInput(false);
    setNewZoneName('');
  };

  // Get rectangle SVG props from two points
  const getRectFromPoints = useCallback((start: PolygonPoint, end: PolygonPoint) => {
    const startPixel = percentToPixel(start);
    const endPixel = percentToPixel(end);
    
    const x = Math.min(startPixel.x, endPixel.x);
    const y = Math.min(startPixel.y, endPixel.y);
    const width = Math.abs(endPixel.x - startPixel.x);
    const height = Math.abs(endPixel.y - startPixel.y);
    
    return { x, y, width, height };
  }, [percentToPixel]);

  // Get rectangle from zone bounds
  const getRectFromZone = useCallback((zone: Zone) => {
    const topLeft = percentToPixel({ x: zone.x_start, y: zone.y_start });
    const bottomRight = percentToPixel({ x: zone.x_end, y: zone.y_end });
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [percentToPixel]);

  return (
    <div className="relative w-full h-full">
      {/* Camera flash overlay */}
      {showFlash && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none bg-white"
          style={{
            animation: 'flash 150ms ease-out forwards',
          }}
        />
      )}
      <style>{`
        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
      
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full overflow-hidden rounded-lg select-none",
          isDrawing && "cursor-crosshair"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Layout"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
          onLoad={calculateBounds}
        />

        {/* SVG overlay for zones */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full">
          {/* Existing zones */}
          {zones.map((zone) => {
            const rect = getRectFromZone(zone);
            
            return (
              <rect
                key={zone.id}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                className={cn(
                  "transition-all cursor-pointer pointer-events-auto",
                  selectedZoneId === zone.id
                    ? "fill-primary/20 stroke-primary"
                    : "fill-amber-500/10 stroke-amber-500/70 hover:fill-amber-500/20 hover:stroke-amber-400"
                )}
                strokeWidth="2"
                rx="2"
                onClick={(e) => {
                  e.stopPropagation();
                  onZoneSelect(zone);
                }}
              />
            );
          })}

          {/* Pending rectangle being named */}
          {pendingRect && (
            <rect
              {...getRectFromPoints(pendingRect.start, pendingRect.end)}
              className="fill-green-500/20 stroke-green-500"
              strokeWidth="2"
              strokeDasharray="5,5"
              rx="2"
            />
          )}

          {/* Current drawing rectangle */}
          {isDrawing && isDragging && dragStart && dragEnd && (
            <rect
              {...getRectFromPoints(dragStart, dragEnd)}
              className="fill-primary/10 stroke-primary"
              strokeWidth="2"
              strokeDasharray="5,5"
              rx="2"
            />
          )}
        </svg>

        {/* Zone labels and delete buttons */}
        {zones.map((zone) => {
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
            <Square className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              {isDragging 
                ? "Release to complete rectangle" 
                : "Click and drag to select area"}
            </span>
            
            <div className="h-4 w-px bg-border mx-1" />
            
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
