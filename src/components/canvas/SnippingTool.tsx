import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Scissors, RotateCcw, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SnippedRegion {
  pixelX: number;
  pixelY: number;
  pixelWidth: number;
  pixelHeight: number;
  croppedDataUrl: string;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

interface SnippingToolProps {
  imageUrl: string;
  onComplete: (region: SnippedRegion) => void;
  onCancel: () => void;
}

export function SnippingTool({ imageUrl, onComplete, onCancel }: SnippingToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  // Load image and set up canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setIsLoaded(true);
      updateCanvas();
    };
    
    img.onerror = () => {
      console.error('Failed to load image for snipping');
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  // Update canvas dimensions and redraw
  const updateCanvas = useCallback(() => {
    if (!canvasRef.current || !containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    // Set canvas to container size
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    
    // Calculate image display size (object-contain behavior)
    const containerAspect = containerRect.width / containerRect.height;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    
    let displayWidth: number;
    let displayHeight: number;
    
    if (imageAspect > containerAspect) {
      // Image is wider - fit to width
      displayWidth = containerRect.width * zoom;
      displayHeight = (containerRect.width / imageAspect) * zoom;
    } else {
      // Image is taller - fit to height
      displayHeight = containerRect.height * zoom;
      displayWidth = (containerRect.height * imageAspect) * zoom;
    }
    
    const offsetX = (containerRect.width - displayWidth) / 2 + pan.x;
    const offsetY = (containerRect.height - displayHeight) / 2 + pan.y;
    
    setDisplayDimensions({ width: displayWidth, height: displayHeight, offsetX, offsetY });
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);
    
    // Draw selection overlay
    if (selection) {
      // Darken non-selected area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear selection area
      ctx.clearRect(selection.x, selection.y, selection.width, selection.height);
      ctx.drawImage(
        img,
        (selection.x - offsetX) / displayWidth * img.naturalWidth,
        (selection.y - offsetY) / displayHeight * img.naturalHeight,
        selection.width / displayWidth * img.naturalWidth,
        selection.height / displayHeight * img.naturalHeight,
        selection.x, selection.y, selection.width, selection.height
      );
      
      // Draw selection border
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
      ctx.setLineDash([]);
      
      // Draw corner handles
      const handleSize = 10;
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(selection.x - handleSize/2, selection.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(selection.x + selection.width - handleSize/2, selection.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(selection.x - handleSize/2, selection.y + selection.height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(selection.x + selection.width - handleSize/2, selection.y + selection.height - handleSize/2, handleSize, handleSize);
      
      // Draw dimensions label
      const pixelWidth = Math.round(selection.width / displayWidth * img.naturalWidth);
      const pixelHeight = Math.round(selection.height / displayHeight * img.naturalHeight);
      const label = `${pixelWidth} × ${pixelHeight} px`;
      
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      const labelWidth = ctx.measureText(label).width + 16;
      const labelX = selection.x + selection.width / 2;
      const labelY = selection.y + selection.height + 30;
      
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.roundRect(labelX - labelWidth/2, labelY - 12, labelWidth, 24, 6);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.fillText(label, labelX, labelY + 4);
    }
  }, [selection, zoom, pan]);

  // Redraw on state changes
  useEffect(() => {
    if (isLoaded) {
      updateCanvas();
    }
  }, [isLoaded, selection, zoom, pan, updateCanvas]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => updateCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvas]);

  // Convert canvas coordinates to image pixel coordinates
  const canvasToImageCoords = useCallback((canvasX: number, canvasY: number) => {
    if (!imageRef.current) return null;
    
    const img = imageRef.current;
    const { width: displayWidth, height: displayHeight, offsetX, offsetY } = displayDimensions;
    
    // Check if point is within image bounds
    if (canvasX < offsetX || canvasX > offsetX + displayWidth ||
        canvasY < offsetY || canvasY > offsetY + displayHeight) {
      return null;
    }
    
    const imageX = ((canvasX - offsetX) / displayWidth) * img.naturalWidth;
    const imageY = ((canvasY - offsetY) / displayHeight) * img.naturalHeight;
    
    return { x: imageX, y: imageY };
  }, [displayDimensions]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (e.shiftKey || e.button === 1) {
      // Pan mode
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else {
      // Selection mode
      setIsDrawing(true);
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setSelection(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    if (isPanning && lastPanPoint) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDrawing && startPoint) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setEndPoint({ x, y });
      
      // Update selection rectangle
      const minX = Math.min(startPoint.x, x);
      const minY = Math.min(startPoint.y, y);
      const maxX = Math.max(startPoint.x, x);
      const maxY = Math.max(startPoint.y, y);
      
      setSelection({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsPanning(false);
    setLastPanPoint(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const resetSelection = () => {
    setSelection(null);
    setStartPoint(null);
    setEndPoint(null);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    resetSelection();
  };

  const handleConfirm = useCallback(() => {
    if (!selection || !imageRef.current || !canvasRef.current) return;
    
    const img = imageRef.current;
    const { width: displayWidth, height: displayHeight, offsetX, offsetY } = displayDimensions;
    
    // Calculate pixel coordinates in original image
    const pixelX = Math.round(((selection.x - offsetX) / displayWidth) * img.naturalWidth);
    const pixelY = Math.round(((selection.y - offsetY) / displayHeight) * img.naturalHeight);
    const pixelWidth = Math.round((selection.width / displayWidth) * img.naturalWidth);
    const pixelHeight = Math.round((selection.height / displayHeight) * img.naturalHeight);
    
    // Validate bounds
    const clampedX = Math.max(0, pixelX);
    const clampedY = Math.max(0, pixelY);
    const clampedWidth = Math.min(pixelWidth, img.naturalWidth - clampedX);
    const clampedHeight = Math.min(pixelHeight, img.naturalHeight - clampedY);
    
    if (clampedWidth < 10 || clampedHeight < 10) {
      console.error('Selection too small');
      return;
    }
    
    // Create cropped canvas
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = clampedWidth;
    cropCanvas.height = clampedHeight;
    
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      clampedX, clampedY, clampedWidth, clampedHeight,
      0, 0, clampedWidth, clampedHeight
    );
    
    const dataUrl = cropCanvas.toDataURL('image/png');
    const aspectRatio = clampedWidth / clampedHeight;
    const orientation = aspectRatio > 1.1 ? 'landscape' : aspectRatio < 0.9 ? 'portrait' : 'square';
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              SNIPPING TOOL - PIXEL PERFECT CROP               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('Crop coordinates (pixels):', { x: clampedX, y: clampedY, width: clampedWidth, height: clampedHeight });
    console.log('Aspect ratio:', aspectRatio.toFixed(2), '(' + orientation + ')');
    
    onComplete({
      pixelX: clampedX,
      pixelY: clampedY,
      pixelWidth: clampedWidth,
      pixelHeight: clampedHeight,
      croppedDataUrl: dataUrl,
      aspectRatio,
      orientation,
    });
  }, [selection, displayDimensions, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scissors className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Snipping Tool</h2>
            <p className="text-sm text-muted-foreground">
              Click and drag to select the area you want to capture
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Canvas area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
        />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading image...</span>
            </div>
          </div>
        )}
        
        {/* Instructions overlay */}
        {isLoaded && !selection && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-card/90 backdrop-blur-sm px-6 py-4 rounded-xl border border-border shadow-lg">
              <p className="text-center text-muted-foreground">
                <span className="block font-medium text-foreground mb-1">Click and drag to select an area</span>
                <span className="text-sm">Hold Shift to pan • Scroll to zoom</span>
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with actions */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
        <div className="text-sm text-muted-foreground">
          {selection ? (
            <span>
              Selected: {Math.round(selection.width / displayDimensions.width * imageDimensions.width)} × {Math.round(selection.height / displayDimensions.height * imageDimensions.height)} pixels
            </span>
          ) : (
            <span>Image: {imageDimensions.width} × {imageDimensions.height} pixels</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selection || selection.width < 20 || selection.height < 20}
            className={cn(
              "gap-2",
              selection && selection.width >= 20 && selection.height >= 20 && "bg-primary hover:bg-primary/90"
            )}
          >
            <Check className="h-4 w-4" />
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
