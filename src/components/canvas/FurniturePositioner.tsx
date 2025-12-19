import { useState, useCallback, useRef, useEffect } from 'react';
import { Move, ZoomIn, ZoomOut, Check, X, GripVertical, RotateCcw, Scan, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FurniturePlacement {
  id: string;
  item: CatalogFurnitureItem;
  position: { x: number; y: number }; // Percentage 0-100
  scale: number; // 0.3 to 2
  originalLabel?: string; // Label of detected item being replaced
}

interface DetectedFurniture {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface FurniturePositionerProps {
  renderUrl: string;
  stagedItems: CatalogFurnitureItem[];
  onConfirm: (placements: FurniturePlacement[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function FurniturePositioner({ 
  renderUrl, 
  stagedItems, 
  onConfirm, 
  onCancel,
  isProcessing = false 
}: FurniturePositionerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<FurniturePlacement[]>(() => 
    stagedItems.map((item, index) => ({
      id: item.id,
      item,
      position: { 
        x: 30 + (index * 20) % 40, // Spread items horizontally
        y: 60 + (index * 10) % 20  // Place toward bottom of room
      },
      scale: 0.8,
    }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(placements[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFurniture, setDetectedFurniture] = useState<DetectedFurniture[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showDetected, setShowDetected] = useState(true);

  const selectedPlacement = placements.find(p => p.id === selectedId);

  // Detect furniture in the room image
  const detectFurniture = async () => {
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-furniture', {
        body: { roomImageUrl: renderUrl }
      });

      if (error) {
        console.error('Detection error:', error);
        toast.error('Failed to detect furniture');
        return;
      }

      if (data?.items && Array.isArray(data.items)) {
        setDetectedFurniture(data.items);
        toast.success(`Detected ${data.items.length} furniture items`);
      }
    } catch (err) {
      console.error('Detection failed:', err);
      toast.error('Failed to detect furniture');
    } finally {
      setIsDetecting(false);
    }
  };

  // Snap placement to detected furniture location
  const snapToDetected = (placementId: string, detected: DetectedFurniture) => {
    setPlacements(prev => prev.map(p => 
      p.id === placementId 
        ? { 
            ...p, 
            position: { x: detected.x, y: detected.y },
            originalLabel: detected.label
          }
        : p
    ));
    toast.success(`Snapped to ${detected.label} position`);
  };

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault();
    setSelectedId(id);
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !selectedId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setPlacements(prev => prev.map(p => 
      p.id === selectedId 
        ? { ...p, position: { x, y } }
        : p
    ));
  }, [isDragging, selectedId]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  const updateScale = (id: string, scale: number) => {
    setPlacements(prev => prev.map(p => 
      p.id === id ? { ...p, scale } : p
    ));
  };

  const resetPlacement = (id: string) => {
    const index = placements.findIndex(p => p.id === id);
    setPlacements(prev => prev.map((p, i) => 
      p.id === id 
        ? { 
            ...p, 
            position: { x: 30 + (index * 20) % 40, y: 60 + (index * 10) % 20 },
            scale: 0.8,
            originalLabel: undefined
          }
        : p
    ));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Move className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Position Furniture</h2>
            <p className="text-xs text-muted-foreground">
              Drag items or snap to detected furniture for 100% accurate staging
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={detectFurniture} 
            disabled={isDetecting || isProcessing}
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Scan className="h-4 w-4 mr-1" />
            )}
            Detect Furniture
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConfirm(placements)} disabled={isProcessing}>
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Apply Positions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 p-4 overflow-hidden">
          <div 
            ref={containerRef}
            className="relative w-full h-full bg-muted rounded-lg overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 180px)' }}
          >
            {/* Background render */}
            <img 
              src={renderUrl} 
              alt="Room render"
              className="w-full h-full object-contain"
              draggable={false}
            />

            {/* Detected furniture markers */}
            {showDetected && detectedFurniture.map((detected) => (
              <div
                key={detected.id}
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${detected.x}%`,
                  top: `${detected.y}%`,
                }}
                onClick={() => {
                  if (selectedId) {
                    snapToDetected(selectedId, detected);
                  }
                }}
              >
                <div className="w-full h-full rounded-full bg-amber-500/80 border-2 border-amber-300 flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 bg-black/80 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {detected.label}
                </div>
              </div>
            ))}

            {/* Furniture overlays */}
            {placements.map((placement) => (
              <div
                key={placement.id}
                className={cn(
                  "absolute cursor-move transition-shadow",
                  selectedId === placement.id && "ring-2 ring-primary ring-offset-2 ring-offset-background z-10",
                  isDragging && selectedId === placement.id && "opacity-80"
                )}
                style={{
                  left: `${placement.position.x}%`,
                  top: `${placement.position.y}%`,
                  transform: `translate(-50%, -50%) scale(${placement.scale})`,
                  width: '120px',
                  height: '120px',
                }}
                onMouseDown={(e) => handleDragStart(e, placement.id)}
                onTouchStart={(e) => handleDragStart(e, placement.id)}
                onClick={() => setSelectedId(placement.id)}
              >
                <img
                  src={placement.item.imageUrl}
                  alt={placement.item.name}
                  className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
                  draggable={false}
                />
                {/* Drag handle indicator */}
                <div className="absolute -top-2 -right-2 p-1 rounded-full bg-primary text-primary-foreground opacity-80">
                  <GripVertical className="h-3 w-3" />
                </div>
                {/* Original label badge */}
                {placement.originalLabel && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-amber-500/90 rounded text-[9px] text-white font-medium whitespace-nowrap">
                    → {placement.originalLabel}
                  </div>
                )}
              </div>
            ))}

            {/* Position indicator */}
            {selectedPlacement && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono">
                X: {selectedPlacement.position.x.toFixed(0)}% | Y: {selectedPlacement.position.y.toFixed(0)}% | Scale: {(selectedPlacement.scale * 100).toFixed(0)}%
                {selectedPlacement.originalLabel && ` | Replacing: ${selectedPlacement.originalLabel}`}
              </div>
            )}
          </div>
        </div>

        {/* Side panel - Item controls */}
        <div className="w-72 border-l border-border bg-card p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Staged Items ({placements.length})
            </h3>
            {detectedFurniture.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowDetected(!showDetected)}
              >
                {showDetected ? 'Hide' : 'Show'} markers
              </Button>
            )}
          </div>

          {/* Detected furniture list */}
          {detectedFurniture.length > 0 && (
            <div className="mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-medium text-amber-600 mb-2">
                Detected: {detectedFurniture.length} items
              </p>
              <div className="flex flex-wrap gap-1">
                {detectedFurniture.map((d) => (
                  <button
                    key={d.id}
                    className="px-2 py-0.5 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 rounded text-amber-700 transition-colors"
                    onClick={() => {
                      if (selectedId) {
                        snapToDetected(selectedId, d);
                      } else {
                        toast.info('Select an item first');
                      }
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {placements.map((placement) => (
              <div 
                key={placement.id}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer",
                  selectedId === placement.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedId(placement.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={placement.item.imageUrl}
                    alt={placement.item.name}
                    className="w-12 h-12 object-contain rounded bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {placement.item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {placement.item.category}
                    </p>
                    {placement.originalLabel && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Replacing: {placement.originalLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Scale control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Scale</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateScale(placement.id, Math.max(0.3, placement.scale - 0.1));
                        }}
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-mono w-10 text-center">
                        {(placement.scale * 100).toFixed(0)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateScale(placement.id, Math.min(2, placement.scale + 0.1));
                        }}
                      >
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Slider
                    value={[placement.scale]}
                    min={0.3}
                    max={2}
                    step={0.05}
                    onValueChange={([val]) => updateScale(placement.id, val)}
                    className="w-full"
                  />
                </div>

                {/* Reset button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetPlacement(placement.id);
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset Position
                </Button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
            <h4 className="text-xs font-semibold text-foreground mb-2">Tips for 100% Accuracy</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Click <strong>Detect Furniture</strong> to find existing items</li>
              <li>• Click amber markers to snap item to that position</li>
              <li>• Drag items to fine-tune placement</li>
              <li>• Adjust scale to match room perspective</li>
              <li>• Items near bottom = closer to camera</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
