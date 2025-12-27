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

export interface Zone {
  id: string;
  name: string;
  x_start: number;
  y_start: number;
  x_end: number;
  y_end: number;
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
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingZone, setPendingZone] = useState<Omit<Zone, 'id' | 'name'> | null>(null);
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

  const getPercentageCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageBounds) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    return pixelToImagePercentage(clientX, clientY, rect, imageBounds);
  }, [imageBounds]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !imageBounds) return;
    e.preventDefault();
    
    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (!coords) return; // Click was in letterbox area
    
    setDrawStart(coords);
    setDrawCurrent(coords);
  }, [isDrawing, imageBounds, getPercentageCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !imageBounds) return;
    
    const coords = getPercentageCoords(e.clientX, e.clientY);
    if (coords) {
      setDrawCurrent(coords);
    }
  }, [isDrawing, drawStart, imageBounds, getPercentageCoords]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    
    const x_start = Math.min(drawStart.x, drawCurrent.x);
    const y_start = Math.min(drawStart.y, drawCurrent.y);
    const x_end = Math.max(drawStart.x, drawCurrent.x);
    const y_end = Math.max(drawStart.y, drawCurrent.y);
    
    // Minimum zone size check (at least 5% in each dimension)
    if (x_end - x_start > 5 && y_end - y_start > 5) {
      setPendingZone({ x_start, y_start, x_end, y_end });
      setShowNameInput(true);
      setNewZoneName(`Zone ${zones.length + 1}`);
    }
    
    setDrawStart(null);
    setDrawCurrent(null);
    onDrawingChange(false);
  }, [isDrawing, drawStart, drawCurrent, zones.length, onDrawingChange]);

  const handleConfirmZone = () => {
    if (pendingZone && newZoneName.trim()) {
      onZoneCreate({
        ...pendingZone,
        name: newZoneName.trim(),
      });
      setPendingZone(null);
      setShowNameInput(false);
      setNewZoneName('');
    }
  };

  const handleCancelZone = () => {
    setPendingZone(null);
    setShowNameInput(false);
    setNewZoneName('');
  };

  // Calculate pixel style for a zone from percentage coordinates
  const getZoneStyle = useCallback((zone: { x_start: number; y_start: number; x_end: number; y_end: number }) => {
    if (!imageBounds) return null;
    
    const topLeft = imagePercentageToPixel(zone.x_start, zone.y_start, imageBounds);
    const bottomRight = imagePercentageToPixel(zone.x_end, zone.y_end, imageBounds);
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [imageBounds]);

  // Calculate current draw rectangle in pixels
  const currentRect = drawStart && drawCurrent && imageBounds ? (() => {
    const x1 = Math.min(drawStart.x, drawCurrent.x);
    const y1 = Math.min(drawStart.y, drawCurrent.y);
    const x2 = Math.max(drawStart.x, drawCurrent.x);
    const y2 = Math.max(drawStart.y, drawCurrent.y);
    
    const topLeft = imagePercentageToPixel(x1, y1, imageBounds);
    const bottomRight = imagePercentageToPixel(x2, y2, imageBounds);
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  })() : null;

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full h-full overflow-hidden rounded-lg",
          isDrawing && "cursor-crosshair"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Room render"
          className="w-full h-full object-contain"
          draggable={false}
          onLoad={calculateBounds}
        />

        {/* Existing zones */}
        {zones.map((zone) => {
          const style = getZoneStyle(zone);
          if (!style) return null;
          
          return (
            <div
              key={zone.id}
              className={cn(
                "absolute border-2 transition-all cursor-pointer group",
                selectedZoneId === zone.id
                  ? "border-primary bg-primary/20"
                  : "border-amber-500/70 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20"
              )}
              style={style}
              onClick={(e) => {
                e.stopPropagation();
                onZoneSelect(zone);
              }}
            >
              {/* Zone label */}
              <div className="absolute top-1 left-1 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                {zone.name}
              </div>
              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 bg-black/70 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Pending zone being drawn */}
        {pendingZone && (() => {
          const style = getZoneStyle(pendingZone);
          if (!style) return null;
          
          return (
            <div
              className="absolute border-2 border-dashed border-green-500 bg-green-500/20"
              style={style}
            />
          );
        })()}

        {/* Current drawing rectangle */}
        {currentRect && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
            style={currentRect}
          />
        )}
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

      {/* Drawing mode indicator */}
      {isDrawing && !drawStart && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 backdrop-blur-md rounded-lg border border-amber-500/30">
            <Square className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              Click and drag to define a zone
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
