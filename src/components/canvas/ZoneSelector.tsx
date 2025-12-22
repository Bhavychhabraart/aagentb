import { useState, useRef, useCallback } from 'react';
import { Square, X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingZone, setPendingZone] = useState<Omit<Zone, 'id' | 'name'> | null>(null);

  const getPercentageCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getPercentageCoords(e.clientX, e.clientY);
    setDrawStart(coords);
    setDrawCurrent(coords);
  }, [isDrawing, getPercentageCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;
    const coords = getPercentageCoords(e.clientX, e.clientY);
    setDrawCurrent(coords);
  }, [isDrawing, drawStart, getPercentageCoords]);

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

  // Calculate current draw rectangle
  const currentRect = drawStart && drawCurrent ? {
    left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
    top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
    width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
    height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
  } : null;

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
          src={imageUrl}
          alt="Room render"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Existing zones */}
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={cn(
              "absolute border-2 transition-all cursor-pointer group",
              selectedZoneId === zone.id
                ? "border-primary bg-primary/20"
                : "border-amber-500/70 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20"
            )}
            style={{
              left: `${zone.x_start}%`,
              top: `${zone.y_start}%`,
              width: `${zone.x_end - zone.x_start}%`,
              height: `${zone.y_end - zone.y_start}%`,
            }}
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
        ))}

        {/* Pending zone being drawn */}
        {pendingZone && (
          <div
            className="absolute border-2 border-dashed border-green-500 bg-green-500/20"
            style={{
              left: `${pendingZone.x_start}%`,
              top: `${pendingZone.y_start}%`,
              width: `${pendingZone.x_end - pendingZone.x_start}%`,
              height: `${pendingZone.y_end - pendingZone.y_start}%`,
            }}
          />
        )}

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
