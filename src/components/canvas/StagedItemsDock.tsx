import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { Button } from '@/components/ui/button';
import { 
  Move, 
  Sparkles, 
  X, 
  ChevronUp, 
  ChevronDown,
  Trash2,
  Maximize2,
  Target
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface StagedItemsDockProps {
  stagedItems: CatalogFurnitureItem[];
  onPositionFurniture: () => void;
  onGenerateWithItems: () => void;
  onClearAll: () => void;
  onRemoveItem: (item: CatalogFurnitureItem) => void;
  onViewAll: () => void;
  onPlaceMarkers?: () => void;
  canPosition: boolean;
  isGenerating?: boolean;
}

export function StagedItemsDock({
  stagedItems,
  onPositionFurniture,
  onGenerateWithItems,
  onClearAll,
  onRemoveItem,
  onViewAll,
  onPlaceMarkers,
  canPosition,
  isGenerating,
}: StagedItemsDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (stagedItems.length === 0) return null;

  const totalPrice = stagedItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <TooltipProvider delayDuration={200}>
      <AnimatePresence>
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-3xl mx-auto"
        >
          <div className="glass-premium rounded-2xl overflow-hidden border border-border/50 shadow-xl">
            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-2 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    {stagedItems.length} item{stagedItems.length !== 1 ? 's' : ''} staged
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAll();
                      }}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View all items</TooltipContent>
                </Tooltip>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearAll();
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="p-3">
                    {/* Item thumbnails */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {stagedItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="relative group flex-shrink-0"
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-14 h-14 rounded-lg overflow-hidden border border-border/50 bg-muted/30 hover:border-primary/50 transition-colors">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                    No img
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.price && (
                                  <p className="text-xs text-muted-foreground">${item.price.toLocaleString()}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          {/* Remove button */}
                          <button
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onClick={() => onRemoveItem(item)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                      {onPlaceMarkers && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 border-primary/50 hover:bg-primary/10"
                              onClick={onPlaceMarkers}
                              disabled={!canPosition || isGenerating}
                            >
                              <Target className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">Place Markers</p>
                            <p className="text-xs text-muted-foreground">Precise batch staging with Gemini 3</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9"
                        onClick={onPositionFurniture}
                        disabled={!canPosition}
                      >
                        <Move className="h-4 w-4 mr-2" />
                        Position
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-9 btn-glow"
                        onClick={onGenerateWithItems}
                        disabled={isGenerating}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
