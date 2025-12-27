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
  Trash2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StagedItemsDockProps {
  stagedItems: CatalogFurnitureItem[];
  onPositionFurniture: () => void;
  onGenerateWithItems: () => void;
  onClearAll: () => void;
  onRemoveItem: (item: CatalogFurnitureItem) => void;
  canPosition: boolean;
  isGenerating?: boolean;
}

export function StagedItemsDock({
  stagedItems,
  onPositionFurniture,
  onGenerateWithItems,
  onClearAll,
  onRemoveItem,
  canPosition,
  isGenerating,
}: StagedItemsDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (stagedItems.length === 0) return null;

  const totalPrice = stagedItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 animate-slide-up">
        <div className="glass-premium rounded-2xl overflow-hidden border border-border/50 shadow-xl">
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-2 bg-primary/5 cursor-pointer"
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
          {isExpanded && (
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
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
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
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveItem(item)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={onPositionFurniture}
                  disabled={!canPosition}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Position on Render
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 btn-glow"
                  onClick={onGenerateWithItems}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with These
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
