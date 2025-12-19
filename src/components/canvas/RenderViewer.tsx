import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, X, Maximize2, LayoutGrid, Image, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface RenderViewerProps {
  imageUrl: string | null;
  isGenerating: boolean;
  layoutImageUrl?: string | null;
  onClose?: () => void;
  onPositionFurniture?: () => void;
}

export function RenderViewer({ imageUrl, isGenerating, layoutImageUrl, onClose, onPositionFurniture }: RenderViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const toggleComparison = () => setShowComparison(!showComparison);

  const hasLayoutToCompare = !!layoutImageUrl && !!imageUrl;

  return (
    <TooltipProvider>
      <div className={cn(
        "flex-1 flex flex-col bg-background relative overflow-hidden",
        isFullscreen && "fixed inset-0 z-50"
      )}>
        {/* Cinematic letterbox bars */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[8%] bg-black/80 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black/80 backdrop-blur-sm" />
        </div>

        {/* Controls */}
        <div className="absolute top-[10%] right-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg border border-border/50 p-1">
            {/* Comparison toggle button */}
            {hasLayoutToCompare && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleComparison}
                      className={cn(
                        "h-8 w-8",
                        showComparison ? "bg-primary/30 text-primary" : "hover:bg-primary/20"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showComparison ? 'Hide layout comparison' : 'Compare with layout'}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border/50 mx-1" />
              </>
            )}

            {/* Position furniture button */}
            {onPositionFurniture && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onPositionFurniture}
                      className="h-8 w-8 hover:bg-primary/20 text-primary"
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Position furniture (100% accurate)</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border/50 mx-1" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5 || !imageUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono px-2 min-w-[3rem] text-center text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3 || !imageUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              disabled={!imageUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={!imageUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          {(onClose || isFullscreen) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isFullscreen ? toggleFullscreen : onClose}
              className="h-8 w-8 bg-black/70 backdrop-blur-md border border-border/50 hover:bg-primary/20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Canvas Area with 16:9 aspect ratio */}
        <div className="flex-1 flex items-center justify-center p-8">
          {showComparison && hasLayoutToCompare ? (
            // Side-by-side comparison view
            <div className="flex gap-4 w-full max-w-6xl h-full max-h-[80vh]">
              {/* Layout reference */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    2D Layout Reference
                  </span>
                </div>
                <div 
                  className={cn(
                    'relative flex-1 rounded-lg overflow-hidden',
                    'bg-black/40 border border-primary/30',
                    'shadow-lg'
                  )}
                >
                  <img
                    src={layoutImageUrl}
                    alt="Layout Reference"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* Corner label */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded text-xs font-mono text-primary border border-primary/30">
                    LAYOUT
                  </div>
                </div>
              </div>

              {/* Generated render */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Image className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Generated Render
                  </span>
                </div>
                <div 
                  className={cn(
                    'relative flex-1 rounded-lg overflow-hidden',
                    'bg-black/40 border border-border/30',
                    'shadow-lg'
                  )}
                >
                  {/* Subtle vignette effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-10" />
                  
                  <img
                    src={imageUrl}
                    alt="Generated Render"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* Corner label */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-foreground border border-border/30">
                    RENDER
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Standard single view
            <div 
              className={cn(
                'relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden',
                'bg-black/40 border border-border/30',
                'shadow-2xl shadow-black/50',
                isDragging && 'cursor-grabbing',
                zoom > 1 && !isDragging && 'cursor-grab'
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Subtle vignette effect */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-10" />
              
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Cinematic loading skeleton */}
                  <div className="absolute inset-4 rounded bg-muted/20 animate-pulse" />
                  <div className="absolute inset-4 bg-shimmer bg-[length:200%_100%] animate-shimmer rounded opacity-50" />
                  
                  {/* Center loading indicator */}
                  <div className="relative z-20 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono tracking-wider uppercase">
                      Generating render...
                    </p>
                  </div>
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Render"
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-200 select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  }}
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-md px-8">
                    {/* Animated placeholder */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
                      <div className="absolute inset-2 rounded-full bg-gradient-brand flex items-center justify-center glow-subtle">
                        <div className="w-8 h-8 rounded-full bg-primary/30" />
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-foreground mb-3">Ready to design</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Upload a room image or describe what you want to create. 
                      Your cinematic 16:9 render will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-4 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-border/30">
            <span className="text-xs font-mono text-muted-foreground">16:9</span>
            <div className="w-px h-3 bg-border/50" />
            <span className="text-xs font-mono text-muted-foreground">1920×1080</span>
            {showComparison && (
              <>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-xs font-mono text-primary">Comparing</span>
              </>
            )}
            {!showComparison && imageUrl && (
              <>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-xs font-mono text-primary">Ready</span>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
