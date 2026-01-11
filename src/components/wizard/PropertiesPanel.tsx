import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCw, Trash2, Copy, ExternalLink, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { PlacedProduct } from '@/types/wizard';

interface PropertiesPanelProps {
  selectedProduct: PlacedProduct | null;
  onClose: () => void;
  onUpdate: (updates: Partial<PlacedProduct>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function PropertiesPanel({
  selectedProduct,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: PropertiesPanelProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <AnimatePresence>
      {selectedProduct && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="w-72 h-full bg-card border-l border-border flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Properties</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Product Preview */}
          <div className="p-4 space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 border border-border">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h4 className="font-medium">{selectedProduct.name}</h4>
              <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
              {selectedProduct.isCustom && (
                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Custom Product
                </span>
              )}
            </div>

            {/* Price */}
            {selectedProduct.price && (
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-xs text-muted-foreground">Estimated Price</p>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(selectedProduct.price)}
                </p>
              </div>
            )}

            <Separator />

            {/* Dimensions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  Dimensions (cm)
                </Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">W</Label>
                  <Input
                    type="number"
                    value={selectedProduct.dimensions.width}
                    onChange={(e) => onUpdate({
                      dimensions: {
                        ...selectedProduct.dimensions,
                        width: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">D</Label>
                  <Input
                    type="number"
                    value={selectedProduct.dimensions.depth}
                    onChange={(e) => onUpdate({
                      dimensions: {
                        ...selectedProduct.dimensions,
                        depth: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">H</Label>
                  <Input
                    type="number"
                    value={selectedProduct.dimensions.height}
                    onChange={(e) => onUpdate({
                      dimensions: {
                        ...selectedProduct.dimensions,
                        height: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-medium text-muted-foreground uppercase">
                  Rotation
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedProduct.rotation}
                  onChange={(e) => onUpdate({ rotation: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm"
                  min={0}
                  max={360}
                />
                <span className="text-sm text-muted-foreground">°</span>
              </div>
              <div className="flex gap-1">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <Button
                    key={angle}
                    variant={selectedProduct.rotation === angle ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => onUpdate({ rotation: angle })}
                  >
                    {angle}°
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={onDuplicate}>
                <Copy className="w-4 h-4" />
                Duplicate
              </Button>
              <Button variant="destructive" size="sm" className="flex-1 gap-2" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>

            {/* View in Catalog */}
            {!selectedProduct.isCustom && (
              <Button variant="ghost" size="sm" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                View in Catalog
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
