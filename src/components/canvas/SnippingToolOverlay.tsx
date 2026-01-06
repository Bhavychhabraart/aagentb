import { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playScreenshotSound } from '@/utils/playScreenshotSound';

interface SnippingToolOverlayProps {
  imageUrl: string;
  onCapture: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function SnippingToolOverlay({ imageUrl, onCapture, onCancel }: SnippingToolOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !imgRef.current) return;
    
    const imgRect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;
    
    // Only start if clicking within image bounds
    if (x >= 0 && x <= imgRect.width && y >= 0 && y <= imgRect.height) {
      setDragStart({ x, y });
      setDragEnd({ x, y });
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imgRef.current) return;
    
    const imgRect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - imgRect.left, imgRect.width));
    const y = Math.max(0, Math.min(e.clientY - imgRect.top, imgRect.height));
    
    setDragEnd({ x, y });
  }, [isDragging]);

  const handleMouseUp = useCallback(async () => {
    if (!isDragging || !dragStart || !dragEnd || !imgRef.current) {
      setIsDragging(false);
      return;
    }
    
    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();
    
    // Calculate selection in display coordinates
    const left = Math.min(dragStart.x, dragEnd.x);
    const top = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);
    
    // Minimum selection size (20px)
    if (width < 20 || height < 20) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    
    setIsCapturing(true);
    playScreenshotSound();
    
    // Calculate scale from display to natural image size
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Convert to natural image coordinates
    const cropX = Math.round(left * scaleX);
    const cropY = Math.round(top * scaleY);
    const cropW = Math.round(width * scaleX);
    const cropH = Math.round(height * scaleY);
    
    try {
      // Load image fresh with CORS to avoid tainted canvas
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => reject(new Error('Failed to load image'));
        // Add cache buster to force fresh load with CORS
        tempImg.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      });
      
      // Create canvas and crop
      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(tempImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Brief delay for visual feedback
        setTimeout(() => {
          onCapture(croppedDataUrl);
        }, 150);
      } else {
        throw new Error('Could not get canvas context');
      }
    } catch (error) {
      console.error('Failed to crop image:', error);
      // Reset state on error
      setIsCapturing(false);
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  }, [isDragging, dragStart, dragEnd, onCapture, imageUrl]);

  // Get selection rectangle style relative to image
  const getSelectionStyle = () => {
    if (!dragStart || !dragEnd) return null;
    
    const left = Math.min(dragStart.x, dragEnd.x);
    const top = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);
    
    return { left, top, width, height };
  };

  const selectionRect = getSelectionStyle();

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] cursor-crosshair select-none bg-black/80"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Centered image container */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Layout"
            className={cn(
              "max-w-[90vw] max-h-[80vh] object-contain",
              !isDragging && "opacity-70"
            )}
            crossOrigin="anonymous"
            onLoad={() => setImageLoaded(true)}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
          
          {/* Selection rectangle overlay on the image */}
          {isDragging && selectionRect && (
            <div
              className={cn(
                "absolute border-2 border-dashed border-white pointer-events-none",
                isCapturing && "bg-white/30"
              )}
              style={{
                left: selectionRect.left,
                top: selectionRect.top,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            >
              {/* Corner handles */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Instruction banner */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-4 px-5 py-3 bg-background/90 backdrop-blur-md rounded-xl border shadow-lg">
          <span className="text-sm font-medium">
            {isDragging 
              ? "Release to capture" 
              : "Click and drag to select area"
            }
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Flash effect on capture */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white/40 pointer-events-none z-20" />
      )}
    </div>
  );
}
