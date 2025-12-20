import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SelectionRegion {
  x: number;      // % from left (0-100)
  y: number;      // % from top (0-100)
  width: number;  // % of image width
  height: number; // % of image height
}

interface SelectionOverlayProps {
  imageUrl: string;
  onSelectionComplete: (region: SelectionRegion | null) => void;
  isActive: boolean;
}

export function SelectionOverlay({ imageUrl, onSelectionComplete, isActive }: SelectionOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelectionRegion | null>(null);

  // Convert pixel coordinates to percentage
  const toPercentage = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;
    e.preventDefault();
    const point = toPercentage(e.clientX, e.clientY);
    setStartPoint(point);
    setIsDrawing(true);
    setCurrentSelection(null);
  }, [isActive, toPercentage]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const current = toPercentage(e.clientX, e.clientY);
    
    const x = Math.min(startPoint.x, current.x);
    const y = Math.min(startPoint.y, current.y);
    const width = Math.abs(current.x - startPoint.x);
    const height = Math.abs(current.y - startPoint.y);
    
    setCurrentSelection({ x, y, width, height });
  }, [isDrawing, startPoint, toPercentage]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentSelection && currentSelection.width > 2 && currentSelection.height > 2) {
      onSelectionComplete(currentSelection);
    } else if (isDrawing) {
      // Too small selection, clear it
      setCurrentSelection(null);
      onSelectionComplete(null);
    }
    setIsDrawing(false);
    setStartPoint(null);
  }, [isDrawing, currentSelection, onSelectionComplete]);

  // Clear selection when overlay becomes inactive
  useEffect(() => {
    if (!isActive) {
      setCurrentSelection(null);
      setIsDrawing(false);
      setStartPoint(null);
    }
  }, [isActive]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-20",
        isActive && "cursor-crosshair"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Darkened overlay outside selection */}
      {currentSelection && (
        <>
          {/* Top dark region */}
          <div 
            className="absolute bg-black/50 left-0 right-0 top-0"
            style={{ height: `${currentSelection.y}%` }}
          />
          {/* Bottom dark region */}
          <div 
            className="absolute bg-black/50 left-0 right-0 bottom-0"
            style={{ height: `${100 - currentSelection.y - currentSelection.height}%` }}
          />
          {/* Left dark region */}
          <div 
            className="absolute bg-black/50 left-0"
            style={{ 
              top: `${currentSelection.y}%`,
              height: `${currentSelection.height}%`,
              width: `${currentSelection.x}%`
            }}
          />
          {/* Right dark region */}
          <div 
            className="absolute bg-black/50 right-0"
            style={{ 
              top: `${currentSelection.y}%`,
              height: `${currentSelection.height}%`,
              width: `${100 - currentSelection.x - currentSelection.width}%`
            }}
          />
          
          {/* Selection rectangle */}
          <div 
            className={cn(
              "absolute border-2 border-primary border-dashed",
              "bg-primary/10",
              isDrawing && "animate-pulse"
            )}
            style={{
              left: `${currentSelection.x}%`,
              top: `${currentSelection.y}%`,
              width: `${currentSelection.width}%`,
              height: `${currentSelection.height}%`,
            }}
          >
            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            
            {/* Dimension label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded whitespace-nowrap">
              {Math.round(currentSelection.width)}% × {Math.round(currentSelection.height)}%
            </div>
          </div>
        </>
      )}

      {/* Instruction hint when active but no selection */}
      {isActive && !currentSelection && !isDrawing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">Click and drag to select an area to edit</p>
          </div>
        </div>
      )}
    </div>
  );
}
