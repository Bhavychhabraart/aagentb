import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RenderViewerProps {
  imageUrl: string | null;
  isGenerating: boolean;
  onClose?: () => void;
}

export function RenderViewer({ imageUrl, isGenerating, onClose }: RenderViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `render-${Date.now()}.png`;
      link.click();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5 || !imageUrl}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono px-2 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3 || !imageUrl}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={!imageUrl}
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={!imageUrl}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 bg-card/90 backdrop-blur-sm border border-border"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Canvas Area */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center',
          isDragging && 'cursor-grabbing',
          zoom > 1 && !isDragging && 'cursor-grab'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isGenerating ? (
          <div className="text-center">
            <div className="relative w-64 h-64 mx-auto mb-4">
              {/* Skeleton with shimmer effect */}
              <div className="absolute inset-0 rounded-lg bg-muted animate-pulse" />
              <div className="absolute inset-0 rounded-lg bg-shimmer bg-[length:200%_100%] animate-shimmer" />
            </div>
            <p className="text-sm text-muted-foreground font-mono">Generating render...</p>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Render"
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
            draggable={false}
          />
        ) : (
          <div className="text-center max-w-md">
            <div className="h-16 w-16 rounded-full bg-gradient-brand mx-auto mb-4 flex items-center justify-center glow-subtle">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Ready to design</h3>
            <p className="text-sm text-muted-foreground">
              Upload a room image or describe what you want to create. Your render will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}