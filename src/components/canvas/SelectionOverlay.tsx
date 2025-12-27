import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  getContainedImageBounds, 
  pixelToImagePercentage,
  imagePercentageToPixel,
  type ImageBounds 
} from '@/utils/imageContainBounds';

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
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelectionRegion | null>(null);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);

  // Calculate actual image bounds when image loads or container resizes
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

  // Set up ResizeObserver to recalculate bounds on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver(calculateBounds);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [calculateBounds]);

  // Convert pixel coordinates to percentage relative to actual image
  const toPercentage = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageBounds) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    return pixelToImagePercentage(clientX, clientY, rect, imageBounds);
  }, [imageBounds]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive || !imageBounds) return;
    e.preventDefault();
    
    const point = toPercentage(e.clientX, e.clientY);
    if (!point) return; // Click was in letterbox area
    
    setStartPoint(point);
    setIsDrawing(true);
    setCurrentSelection(null);
  }, [isActive, imageBounds, toPercentage]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !imageBounds) return;
    
    const current = toPercentage(e.clientX, e.clientY);
    if (!current) return;
    
    const x = Math.min(startPoint.x, current.x);
    const y = Math.min(startPoint.y, current.y);
    const width = Math.abs(current.x - startPoint.x);
    const height = Math.abs(current.y - startPoint.y);
    
    setCurrentSelection({ x, y, width, height });
  }, [isDrawing, startPoint, imageBounds, toPercentage]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentSelection && currentSelection.width > 2 && currentSelection.height > 2) {
      onSelectionComplete(currentSelection);
    } else if (isDrawing) {
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

  // Calculate pixel positions for rendering overlays
  const getSelectionStyle = useCallback(() => {
    if (!currentSelection || !imageBounds) return null;
    
    const topLeft = imagePercentageToPixel(currentSelection.x, currentSelection.y, imageBounds);
    const bottomRight = imagePercentageToPixel(
      currentSelection.x + currentSelection.width, 
      currentSelection.y + currentSelection.height, 
      imageBounds
    );
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [currentSelection, imageBounds]);

  const selectionStyle = getSelectionStyle();

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
      {/* Hidden image to get natural dimensions */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        className="absolute opacity-0 pointer-events-none"
        onLoad={calculateBounds}
      />

      {/* Darkened overlay outside selection - positioned relative to actual image */}
      {selectionStyle && imageBounds && (
        <>
          {/* Top dark region */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              left: imageBounds.x,
              top: imageBounds.y,
              width: imageBounds.width,
              height: selectionStyle.top - imageBounds.y
            }}
          />
          {/* Bottom dark region */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              left: imageBounds.x,
              top: selectionStyle.top + selectionStyle.height,
              width: imageBounds.width,
              height: (imageBounds.y + imageBounds.height) - (selectionStyle.top + selectionStyle.height)
            }}
          />
          {/* Left dark region */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              left: imageBounds.x,
              top: selectionStyle.top,
              width: selectionStyle.left - imageBounds.x,
              height: selectionStyle.height
            }}
          />
          {/* Right dark region */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              left: selectionStyle.left + selectionStyle.width,
              top: selectionStyle.top,
              width: (imageBounds.x + imageBounds.width) - (selectionStyle.left + selectionStyle.width),
              height: selectionStyle.height
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
              left: selectionStyle.left,
              top: selectionStyle.top,
              width: selectionStyle.width,
              height: selectionStyle.height,
            }}
          >
            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            
            {/* Dimension label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded whitespace-nowrap">
              {Math.round(currentSelection!.width)}% × {Math.round(currentSelection!.height)}%
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
