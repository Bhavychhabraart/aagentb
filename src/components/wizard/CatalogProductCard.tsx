import React from 'react';
import { Plus, GripVertical, Eye, Heart } from 'lucide-react';
import { BentChairProduct, formatPrice } from '@/services/bentchairCatalogService';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CatalogProductCardProps {
  product: BentChairProduct;
  onAddToCanvas: (product: BentChairProduct) => void;
  onPreview?: (product: BentChairProduct) => void;
  onFavorite?: (product: BentChairProduct) => void;
  isDragging?: boolean;
  compact?: boolean;
}

export function CatalogProductCard({
  product,
  onAddToCanvas,
  onPreview,
  onFavorite,
  isDragging = false,
  compact = false,
}: CatalogProductCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'product',
      product,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group relative bg-card rounded-lg overflow-hidden cursor-grab active:cursor-grabbing",
        "border border-border/50 hover:border-primary/30 transition-all duration-300",
        "shadow-sm hover:shadow-lg hover:-translate-y-1",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-background/80 backdrop-blur-sm rounded p-1">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onPreview && (
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(product); }}
            className="bg-background/80 backdrop-blur-sm rounded p-1.5 hover:bg-background transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(product); }}
            className="bg-background/80 backdrop-blur-sm rounded p-1.5 hover:bg-background transition-colors"
          >
            <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Sale Badge */}
      {product.originalPrice && product.originalPrice > product.price && (
        <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs">
          {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
        </Badge>
      )}

      {/* Product Image */}
      <div className={cn(
        "relative bg-muted/30 overflow-hidden",
        compact ? "aspect-square" : "aspect-[4/3]"
      )}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-2 left-2 right-2">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCanvas(product); }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add to Canvas
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className={cn("p-3", compact && "p-2")}>
        <h4 className={cn(
          "font-medium text-foreground line-clamp-1",
          compact ? "text-xs" : "text-sm"
        )}>
          {product.name}
        </h4>
        
        {product.brand && !compact && (
          <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-foreground",
              compact ? "text-xs" : "text-sm"
            )}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {!compact && (
            <div className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              product.inStock 
                ? "bg-green-500/10 text-green-600" 
                : "bg-amber-500/10 text-amber-600"
            )}>
              {product.inStock ? 'In Stock' : product.leadTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
