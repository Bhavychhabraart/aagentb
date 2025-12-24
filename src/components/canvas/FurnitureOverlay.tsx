import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Package, MousePointer } from 'lucide-react';

export interface StagedFurnitureItem {
  id: string;
  catalog_item_id: string;
  item_name: string;
  item_category: string;
  item_description: string | null;
  item_image_url: string | null;
  item_price: number | null;
  x_position: number;
  y_position: number;
  width_percent: number;
  height_percent: number;
}

interface FurnitureOverlayProps {
  stagedFurniture: StagedFurnitureItem[];
  onFurnitureClick: (furniture: StagedFurnitureItem) => void;
  selectedFurnitureId?: string | null;
  disabled?: boolean;
}

export function FurnitureOverlay({
  stagedFurniture,
  onFurnitureClick,
  selectedFurnitureId,
  disabled = false,
}: FurnitureOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (stagedFurniture.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center p-4 bg-background/60 backdrop-blur-sm rounded-lg border border-dashed border-muted-foreground/30">
          <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">No furniture placed yet</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Add items from the catalog
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="absolute inset-0">
        {/* Instructions overlay */}
        {!disabled && stagedFurniture.length > 0 && (
          <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-[10px] text-muted-foreground flex items-center gap-1.5">
            <MousePointer className="h-3 w-3" />
            Click furniture to replace
          </div>
        )}

        {stagedFurniture.map((furniture) => {
          const isSelected = selectedFurnitureId === furniture.id;
          const isHovered = hoveredId === furniture.id;

          return (
            <Tooltip key={furniture.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !disabled && onFurnitureClick(furniture)}
                  onMouseEnter={() => setHoveredId(furniture.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  disabled={disabled}
                  className={cn(
                    "absolute transition-all duration-200 cursor-pointer",
                    "border-2 rounded-lg backdrop-blur-[2px]",
                    "hover:scale-105 active:scale-95",
                    "flex items-center justify-center overflow-hidden",
                    isSelected
                      ? "border-primary bg-primary/20 ring-2 ring-primary/40 z-10"
                      : isHovered
                        ? "border-primary/60 bg-primary/10 z-10"
                        : "border-dashed border-muted-foreground/40 bg-background/20",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  style={{
                    left: `${furniture.x_position - furniture.width_percent / 2}%`,
                    top: `${furniture.y_position - furniture.height_percent / 2}%`,
                    width: `${furniture.width_percent}%`,
                    height: `${furniture.height_percent}%`,
                    minWidth: '60px',
                    minHeight: '60px',
                  }}
                >
                  {/* Furniture thumbnail or icon */}
                  {furniture.item_image_url ? (
                    <img
                      src={furniture.item_image_url}
                      alt={furniture.item_name}
                      className={cn(
                        "w-full h-full object-contain p-1 transition-opacity",
                        (isSelected || isHovered) ? "opacity-90" : "opacity-60"
                      )}
                      draggable={false}
                    />
                  ) : (
                    <Package className={cn(
                      "h-6 w-6 transition-colors",
                      (isSelected || isHovered) ? "text-primary" : "text-muted-foreground/50"
                    )} />
                  )}

                  {/* Label */}
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[9px] font-medium truncate text-center transition-all",
                    (isSelected || isHovered)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/80 text-foreground/80"
                  )}>
                    {furniture.item_name}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="text-xs">
                  <p className="font-medium">{furniture.item_name}</p>
                  <p className="text-muted-foreground">{furniture.item_category}</p>
                  {furniture.item_price && (
                    <p className="text-primary mt-0.5">${furniture.item_price.toLocaleString()}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Click to replace with different product
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
