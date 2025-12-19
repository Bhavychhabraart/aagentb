import { useState, useCallback, useRef, useEffect } from 'react';
import { Move, ZoomIn, ZoomOut, Check, X, GripVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { CatalogFurnitureItem } from '@/services/catalogService';

export interface FurniturePlacement {
  id: string;
  item: CatalogFurnitureItem;
  position: { x: number; y: number }; // Percentage 0-100
  scale: number; // 0.3 to 2
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

  const selectedPlacement = placements.find(p => p.id === selectedId);

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
            scale: 0.8 
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
              Drag items to position, adjust scale for 100% accurate staging
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConfirm(placements)} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <span className="animate-pulse">Processing...</span>
              </>
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
              </div>
            ))}

            {/* Position indicator */}
            {selectedPlacement && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono">
                X: {selectedPlacement.position.x.toFixed(0)}% | Y: {selectedPlacement.position.y.toFixed(0)}% | Scale: {(selectedPlacement.scale * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Side panel - Item controls */}
        <div className="w-72 border-l border-border bg-card p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Staged Items ({placements.length})
          </h3>

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
            <h4 className="text-xs font-semibold text-foreground mb-2">Tips for Accuracy</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Drag items to their exact position</li>
              <li>• Adjust scale to match room perspective</li>
              <li>• Items near bottom = closer to camera</li>
              <li>• The AI will preserve exact product appearance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
