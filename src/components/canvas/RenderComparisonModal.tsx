import { useState, useEffect } from 'react';
import { X, Columns2, Layers, ArrowLeftRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Zone } from './ZoneSelector';
import { cropRectangleFromImage, cropPolygonFromRender } from '@/utils/cropZoneImage';

interface RenderComparisonModalProps {
  layoutImageUrl: string | null;
  currentRenderUrl: string;
  selectedZone?: Zone | null;
  zoneRenderUrl?: string | null;
  onClose: () => void;
}

export function RenderComparisonModal({
  layoutImageUrl,
  currentRenderUrl,
  selectedZone,
  zoneRenderUrl,
  onClose,
}: RenderComparisonModalProps) {
  const [croppedLayoutUrl, setCroppedLayoutUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'overlay'>('split');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  // If a zone is selected, crop from layout; otherwise use full layout
  useEffect(() => {
    const prepareLayout = async () => {
      if (!layoutImageUrl) {
        setCroppedLayoutUrl(null);
        return;
      }

      if (selectedZone) {
        setIsLoading(true);
        try {
          let cropped: string;
          
          if (selectedZone.polygon_points && selectedZone.polygon_points.length >= 3) {
            cropped = await cropPolygonFromRender(layoutImageUrl, selectedZone.polygon_points);
          } else {
            cropped = await cropRectangleFromImage(layoutImageUrl, {
              x_start: selectedZone.x_start,
              y_start: selectedZone.y_start,
              x_end: selectedZone.x_end,
              y_end: selectedZone.y_end,
            });
          }
          
          setCroppedLayoutUrl(cropped);
        } catch (error) {
          console.error('Failed to crop zone:', error);
          setCroppedLayoutUrl(layoutImageUrl);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCroppedLayoutUrl(layoutImageUrl);
      }
    };

    prepareLayout();
  }, [layoutImageUrl, selectedZone]);

  const leftLabel = selectedZone ? `Zone: ${selectedZone.name}` : 'Layout (2D)';
  const rightLabel = zoneRenderUrl ? 'Zone Render' : 'Current Render';
  const rightImageUrl = zoneRenderUrl || currentRenderUrl;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-border/50">
        <DialogHeader className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Columns2 className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-semibold">
                {selectedZone ? `Zone Comparison: ${selectedZone.name}` : 'Layout vs Render Comparison'}
              </DialogTitle>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-3 text-xs",
                    viewMode === 'split' && "bg-primary/20 text-primary"
                  )}
                  onClick={() => setViewMode('split')}
                >
                  <Columns2 className="h-3 w-3 mr-1" />
                  Split
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-3 text-xs",
                    viewMode === 'overlay' && "bg-primary/20 text-primary"
                  )}
                  onClick={() => setViewMode('overlay')}
                >
                  <Layers className="h-3 w-3 mr-1" />
                  Overlay
                </Button>
              </div>
              
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Preparing comparison...</p>
              </div>
            </div>
          ) : !croppedLayoutUrl ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No layout image available</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Upload a layout to compare with renders</p>
              </div>
            </div>
          ) : viewMode === 'split' ? (
            /* Split view mode */
            <div className="flex gap-4 h-[60vh]">
              {/* Layout side */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Layers className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {leftLabel}
                  </span>
                </div>
                <div className="flex-1 relative rounded-lg overflow-hidden bg-black/40 border border-amber-500/30">
                  <img
                    src={croppedLayoutUrl}
                    alt="Layout"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500/20 backdrop-blur-sm rounded text-xs font-mono text-amber-400 border border-amber-500/30">
                    LAYOUT
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center px-2">
                <div className="flex flex-col items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider writing-mode-vertical">
                    Compare
                  </span>
                </div>
              </div>

              {/* Render side */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {rightLabel}
                  </span>
                </div>
                <div className="flex-1 relative rounded-lg overflow-hidden bg-black/40 border border-primary/30">
                  <img
                    src={rightImageUrl}
                    alt="Render"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded text-xs font-mono text-primary border border-primary/30">
                    RENDER
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Overlay view mode */
            <div className="flex flex-col h-[60vh]">
              {/* Opacity slider */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-xs text-muted-foreground">Layout</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-48 accent-primary"
                />
                <span className="text-xs text-muted-foreground">Render</span>
              </div>
              
              {/* Overlay container */}
              <div className="flex-1 relative rounded-lg overflow-hidden bg-black/40 border border-border/50">
                {/* Layout (bottom layer) */}
                <img
                  src={croppedLayoutUrl}
                  alt="Layout"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: 1 - overlayOpacity }}
                  draggable={false}
                />
                
                {/* Render (top layer) */}
                <img
                  src={rightImageUrl}
                  alt="Render"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: overlayOpacity }}
                  draggable={false}
                />
                
                {/* Labels */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500/20 backdrop-blur-sm rounded text-xs font-mono text-amber-400 border border-amber-500/30">
                  LAYOUT {Math.round((1 - overlayOpacity) * 100)}%
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded text-xs font-mono text-primary border border-primary/30">
                  RENDER {Math.round(overlayOpacity * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedZone 
              ? 'Compare the cropped zone with its generated render'
              : 'Compare your 2D layout with the AI-generated render'
            }
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}