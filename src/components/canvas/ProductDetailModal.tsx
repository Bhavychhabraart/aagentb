import { X, Plus, Check, ShoppingBag, Tag, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CatalogFurnitureItem } from '@/services/catalogService';

interface ProductDetailModalProps {
  item: CatalogFurnitureItem | null;
  isOpen: boolean;
  onClose: () => void;
  isStaged: boolean;
  onToggleStage: (item: CatalogFurnitureItem) => void;
}

export function ProductDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  isStaged, 
  onToggleStage 
}: ProductDetailModalProps) {
  if (!item) return null;

  const handleToggleStage = () => {
    onToggleStage(item);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        {/* Image Section */}
        <div className="relative aspect-square bg-muted">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Close button overlay */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Staged indicator */}
          {isStaged && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
              <Check className="h-3 w-3" />
              Staged
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-lg font-semibold text-foreground leading-tight">
                {item.name}
              </DialogTitle>
              {item.price > 0 && (
                <span className="text-lg font-bold text-primary shrink-0">
                  ${item.price.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {item.category}
              </Badge>
              {item.brand && (
                <Badge variant="outline" className="gap-1">
                  <ShoppingBag className="h-3 w-3" />
                  {item.brand}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>

          {/* Action Button */}
          <Button
            onClick={handleToggleStage}
            variant={isStaged ? "secondary" : "default"}
            className="w-full gap-2"
          >
            {isStaged ? (
              <>
                <Check className="h-4 w-4" />
                Remove from Stage
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Stage
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Staged items will be included in your next design render
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
