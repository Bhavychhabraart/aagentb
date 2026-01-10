import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, ZoomOut, RefreshCw, Wand2, ImageIcon, Loader2, 
  Share2, Download, Maximize2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewCanvasProps {
  generatedImage: string | null;
  isGenerating: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onRefine?: () => void;
  onRegenerate?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  className?: string;
  adjustments?: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

export function PreviewCanvas({
  generatedImage,
  isGenerating,
  zoom,
  onZoomChange,
  onRefine,
  onRegenerate,
  onShare,
  onDownload,
  className,
  adjustments,
}: PreviewCanvasProps) {
  const minZoom = 25;
  const maxZoom = 200;

  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 border-b border-border/50 glass"
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onZoomChange(Math.max(minZoom, zoom - 25))}
                  disabled={zoom <= minZoom}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground min-w-[50px] text-center">
            {zoom}%
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onZoomChange(Math.min(maxZoom, zoom + 25))}
                  disabled={zoom >= maxZoom}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Action Buttons */}
        <AnimatePresence>
          {generatedImage && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-1.5"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={onShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={onDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="w-px h-5 bg-border mx-1" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={onRefine}
                className="gap-1.5 rounded-lg h-8 text-xs border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Refine
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="gap-1.5 rounded-lg h-8 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Preview Area with White Background */}
      <div className="flex-1 relative overflow-hidden">
        {/* Pure White Background */}
        <div className="absolute inset-0 bg-white" />
        
        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{
              width: `${Math.min(550, 500 * (zoom / 100))}px`,
              height: `${Math.min(550, 500 * (zoom / 100))}px`,
            }}
          >
            {/* White Container */}
            <div className={cn(
              "w-full h-full rounded-2xl overflow-hidden",
              "bg-white border border-border/20 shadow-sm",
              "flex items-center justify-center",
              "transition-all duration-300"
            )}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center p-8"
                  >
                    {/* Animated Loader */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                      <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <p className="text-lg font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Creating your furniture...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      AI is working its magic
                    </p>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.img
                    key="image"
                    src={generatedImage}
                    alt="Generated Furniture"
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      filter: adjustments
                        ? `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`
                        : undefined,
                    }}
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-8"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">
                      Preview Area
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-2 max-w-[200px] mx-auto">
                      Describe your furniture and click Generate to see the magic
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating Glow Effect when image is present */}
            {generatedImage && !isGenerating && (
              <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-xl -z-10 animate-pulse" />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
