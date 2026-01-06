import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playScreenshotSound } from '@/utils/playScreenshotSound';
import { 
  getContainedImageBounds, 
  pixelToImagePercentage,
  type ImageBounds 
} from '@/utils/imageContainBounds';

interface SnippingToolOverlayProps {
  imageUrl: string;
  onCapture: (bounds: { x_start: number; y_start: number; x_end: number; y_end: number }) => void;
  onCancel: () => void;
}

export function SnippingToolOverlay({ imageUrl, onCapture, onCancel }: SnippingToolOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Calculate image bounds
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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    
    if (isDragging && dragStart) {
      setDragEnd({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageBounds || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const coords = pixelToImagePercentage(e.clientX, e.clientY, rect, imageBounds);
    
    // Only start drag if clicking within the image bounds
    if (coords) {
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragEnd({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    }
  }, [imageBounds]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !dragEnd || !imageBounds || !containerRef.current) {
      setIsDragging(false);
      return;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Convert pixel positions to image percentages
    const startCoords = pixelToImagePercentage(dragStart.x, dragStart.y, rect, imageBounds);
    const endCoords = pixelToImagePercentage(e.clientX, e.clientY, rect, imageBounds);
    
    if (!startCoords || !endCoords) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    
    // Calculate selection dimensions
    const width = Math.abs(endCoords.x - startCoords.x);
    const height = Math.abs(endCoords.y - startCoords.y);
    
    // Only capture if selection is large enough (at least 2% in both dimensions)
    if (width >= 2 && height >= 2) {
      setIsCapturing(true);
      
      // Play screenshot sound
      playScreenshotSound();
      
      // Normalize bounds (ensure start < end) and clamp to 0-100
      const x_start = Math.max(0, Math.min(100, Math.min(startCoords.x, endCoords.x)));
      const y_start = Math.max(0, Math.min(100, Math.min(startCoords.y, endCoords.y)));
      const x_end = Math.max(0, Math.min(100, Math.max(startCoords.x, endCoords.x)));
      const y_end = Math.max(0, Math.min(100, Math.max(startCoords.y, endCoords.y)));
      
      // Brief flash animation before completing
      setTimeout(() => {
        onCapture({ x_start, y_start, x_end, y_end });
      }, 150);
    } else {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  }, [isDragging, dragStart, dragEnd, imageBounds, onCapture]);

  // Calculate selection rectangle in pixels
  const getSelectionRect = () => {
    if (!dragStart || !dragEnd) return null;
    
    const left = Math.min(dragStart.x, dragEnd.x);
    const top = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);
    
    return { left, top, width, height };
  };

  // Calculate selection dimensions as percentages for display
  const getSelectionDimensions = () => {
    if (!dragStart || !dragEnd || !imageBounds || !containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const startCoords = pixelToImagePercentage(dragStart.x, dragStart.y, rect, imageBounds);
    const endCoords = pixelToImagePercentage(dragEnd.x, dragEnd.y, rect, imageBounds);
    
    if (!startCoords || !endCoords) return null;
    
    const width = Math.abs(endCoords.x - startCoords.x);
    const height = Math.abs(endCoords.y - startCoords.y);
    
    return { width: Math.round(width), height: Math.round(height) };
  };

  const selectionRect = getSelectionRect();
  const dimensions = getSelectionDimensions();

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Dark overlay background */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Layout image centered */}
      <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Layout"
          className="max-w-full max-h-full object-contain opacity-60"
          onLoad={calculateBounds}
          draggable={false}
        />
      </div>

      {/* Selection rectangle */}
      {isDragging && selectionRect && (
        <>
          {/* Bright cut-out area */}
          <div
            className={cn(
              "absolute border-2 border-white shadow-2xl transition-opacity",
              isCapturing && "animate-pulse bg-white/30"
            )}
            style={{
              left: selectionRect.left,
              top: selectionRect.top,
              width: selectionRect.width,
              height: selectionRect.height,
            }}
          >
            {/* Selection overlay with actual image showing through */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: imageBounds 
                  ? `${imageBounds.width}px ${imageBounds.height}px` 
                  : 'contain',
                backgroundPosition: imageBounds 
                  ? `${imageBounds.x - selectionRect.left}px ${imageBounds.y - selectionRect.top}px`
                  : 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full shadow-lg" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-lg" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full shadow-lg" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full shadow-lg" />
          </div>

          {/* Dimension label */}
          {dimensions && selectionRect.width > 60 && selectionRect.height > 40 && (
            <div
              className="absolute px-2 py-1 bg-black/90 text-white text-xs font-mono rounded shadow-lg pointer-events-none"
              style={{
                left: selectionRect.left + selectionRect.width / 2,
                top: selectionRect.top + selectionRect.height / 2,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {dimensions.width}% × {dimensions.height}%
            </div>
          )}
        </>
      )}

      {/* Crosshair cursor */}
      {!isDragging && (
        <div 
          className="pointer-events-none fixed z-[110]"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Vertical line */}
          <div className="absolute left-1/2 -translate-x-1/2 w-px h-10 bg-white/90 -top-5" />
          {/* Horizontal line */}
          <div className="absolute top-1/2 -translate-y-1/2 h-px w-10 bg-white/90 -left-5" />
          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white bg-transparent" />
        </div>
      )}

      {/* Instruction banner */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110]">
        <div className="flex items-center gap-4 px-5 py-3 bg-black/90 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl">
          <span className="text-sm text-white font-medium">
            {isDragging 
              ? "Release to capture zone" 
              : "Click and drag to select zone area"
            }
          </span>
          <div className="h-4 w-px bg-white/30" />
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            <span>ESC to cancel</span>
          </button>
        </div>
      </div>

      {/* Flash effect on capture */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white/50 animate-pulse pointer-events-none z-[120]" />
      )}
    </div>
  );
}
