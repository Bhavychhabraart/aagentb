import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Trash2, Check, Sparkles, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface StagingMarker {
  id: string;
  position: { x: number; y: number }; // Percentage 0-100
  product: CatalogFurnitureItem | null;
  existingLabel?: string;
  confirmed: boolean;
}

interface MarkerStagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  renderUrl: string;
  markers: StagingMarker[];
  onMarkerAdd: (position: { x: number; y: number }) => void;
  onMarkerRemove: (markerId: string) => void;
  onMarkerProductSelect: (markerId: string) => void;
  onClearAll: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  activeMarkerId: string | null;
}

export function MarkerStagingPanel({
  isOpen,
  onClose,
  renderUrl,
  markers,
  onMarkerAdd,
  onMarkerRemove,
  onMarkerProductSelect,
  onClearAll,
  onGenerate,
  isGenerating,
  activeMarkerId,
}: MarkerStagingPanelProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isPlacingMarker, setIsPlacingMarker] = useState(true);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingMarker || isGenerating) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp to 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onMarkerAdd({ x: clampedX, y: clampedY });
  }, [isPlacingMarker, isGenerating, onMarkerAdd]);

  const confirmedMarkers = markers.filter(m => m.product !== null);
  const pendingMarkers = markers.filter(m => m.product === null);
  const canGenerate = confirmedMarkers.length > 0 && !isGenerating;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Marker Staging</h2>
            </div>
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">Markers:</span>
              <span className="font-semibold">{markers.length}</span>
            </Badge>
            {confirmedMarkers.length > 0 && (
              <Badge variant="default" className="gap-1 bg-green-600">
                <Check className="h-3 w-3" />
                {confirmedMarkers.length} ready
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {markers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                disabled={isGenerating}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="gap-2 btn-glow"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? 'Generating...' : `Generate (${confirmedMarkers.length} items)`}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-full pt-16 flex">
          {/* Image Area */}
          <div className="flex-1 relative flex items-center justify-center p-6">
            <div
              ref={imageContainerRef}
              className="relative max-w-full max-h-full cursor-crosshair"
              onClick={handleImageClick}
            >
              <img
                src={renderUrl}
                alt="Room render"
                className="max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-xl shadow-2xl"
                draggable={false}
              />

              {/* Markers Overlay */}
              <TooltipProvider delayDuration={100}>
                {markers.map((marker, index) => (
                  <Tooltip key={marker.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10
                          ${marker.product ? 'group' : 'animate-pulse'}`}
                        style={{
                          left: `${marker.position.x}%`,
                          top: `${marker.position.y}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!marker.product) {
                            onMarkerProductSelect(marker.id);
                          }
                        }}
                      >
                        {marker.product ? (
                          // Confirmed marker with product thumbnail
                          <div className="relative">
                            <div className="w-12 h-12 rounded-lg border-2 border-green-500 overflow-hidden shadow-lg bg-background">
                              {marker.product.imageUrl ? (
                                <img
                                  src={marker.product.imageUrl}
                                  alt={marker.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center shadow">
                              {index + 1}
                            </div>
                            {/* Remove button */}
                            <button
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkerRemove(marker.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          // Pending marker (needs product selection)
                          <div className="relative">
                            <div 
                              className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center shadow-lg
                                ${activeMarkerId === marker.id 
                                  ? 'border-primary bg-primary/20' 
                                  : 'border-orange-500 bg-orange-500/20 hover:bg-orange-500/30'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkerProductSelect(marker.id);
                              }}
                            >
                              <span className="text-sm font-bold">{index + 1}</span>
                            </div>
                            <button
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkerRemove(marker.id);
                              }}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {marker.product ? (
                        <div>
                          <p className="font-medium">{marker.product.name}</p>
                          <p className="text-xs text-muted-foreground">{marker.product.category}</p>
                          {marker.product.price && (
                            <p className="text-xs text-primary">${marker.product.price.toLocaleString()}</p>
                          )}
                        </div>
                      ) : (
                        <p>Click to select product</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>

              {/* Instruction overlay when no markers */}
              {markers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] rounded-xl">
                  <Card className="p-6 max-w-sm text-center glass-premium">
                    <Target className="h-10 w-10 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Place Markers</h3>
                    <p className="text-sm text-muted-foreground">
                      Click on furniture you want to replace. After placing markers, select products for each one.
                    </p>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel - Marker List */}
          <div className="w-80 border-l border-border/50 bg-background/50 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-border/50">
              <h3 className="font-semibold mb-1">Staged Replacements</h3>
              <p className="text-xs text-muted-foreground">
                {markers.length === 0 
                  ? 'Click on the image to place markers'
                  : `${confirmedMarkers.length} of ${markers.length} configured`
                }
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {markers.map((marker, index) => (
                  <Card 
                    key={marker.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      marker.product 
                        ? 'border-green-500/50 bg-green-500/5' 
                        : activeMarkerId === marker.id
                          ? 'border-primary bg-primary/5'
                          : 'border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10'
                    }`}
                    onClick={() => !marker.product && onMarkerProductSelect(marker.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        marker.product ? 'bg-green-500 text-white' : 'bg-orange-500/20 text-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {marker.product ? (
                          <>
                            <p className="font-medium text-sm truncate">{marker.product.name}</p>
                            <p className="text-xs text-muted-foreground">{marker.product.category}</p>
                            {marker.product.price && (
                              <p className="text-xs text-primary mt-0.5">${marker.product.price.toLocaleString()}</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">Pending selection</p>
                            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                              <ChevronRight className="h-3 w-3" />
                              Click to select product
                            </p>
                          </>
                        )}
                      </div>
                      {marker.product && (
                        <div className="w-10 h-10 rounded overflow-hidden border border-border/50">
                          {marker.product.imageUrl && (
                            <img
                              src={marker.product.imageUrl}
                              alt={marker.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkerRemove(marker.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {markers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No markers placed yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border/50 space-y-3">
              {pendingMarkers.length > 0 && (
                <p className="text-xs text-orange-600 text-center">
                  {pendingMarkers.length} marker{pendingMarkers.length > 1 ? 's' : ''} need product selection
                </p>
              )}
              <Button
                className="w-full gap-2 btn-glow"
                onClick={onGenerate}
                disabled={!canGenerate}
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Generating with Gemini 3...' : 'Generate All Replacements'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Powered by Gemini 3 Pro for maximum accuracy
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
