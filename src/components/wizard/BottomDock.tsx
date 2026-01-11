import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Palette, Image, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PlacedProduct, StyleReference } from '@/types/wizard';

interface BottomDockProps {
  colorPalette: string[];
  styleReferences: StyleReference[];
  placedProducts: PlacedProduct[];
  onAddColor: (color: string) => void;
  onRemoveColor: (color: string) => void;
  onAddStyleRef: (ref: StyleReference) => void;
  onRemoveStyleRef: (refId: string) => void;
  onProductClick: (productId: string) => void;
  onGenerateStyle: () => void;
}

const PRESET_COLORS = [
  '#F5E6D3', '#E8D5C4', '#D4B896', '#C4A77D', '#8B7355',
  '#2D3436', '#636E72', '#B2BEC3', '#DFE6E9', '#FFFFFF',
  '#74B9FF', '#0984E3', '#00CEC9', '#00B894', '#55EFC4',
  '#FDCB6E', '#E17055', '#D63031', '#E84393', '#6C5CE7',
];

export function BottomDock({
  colorPalette,
  styleReferences,
  placedProducts,
  onAddColor,
  onRemoveColor,
  onAddStyleRef,
  onRemoveStyleRef,
  onProductClick,
  onGenerateStyle,
}: BottomDockProps) {
  const [customColor, setCustomColor] = useState('#000000');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="h-32 bg-card border-t border-border">
      <div className="h-full flex">
        {/* Color Palette Section */}
        <div className="flex-1 p-3 border-r border-border">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Color Palette
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AnimatePresence>
              {colorPalette.map((color) => (
                <motion.div
                  key={color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative group"
                >
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-white shadow-md cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={() => onRemoveColor(color)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="w-10 h-10">
                  <Plus className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Add Color</p>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => onAddColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <Button size="sm" onClick={() => onAddColor(customColor)}>
                      Add
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Style References Section */}
        <div className="flex-1 p-3 border-r border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Style References
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={onGenerateStyle}>
              <Sparkles className="w-3 h-3" />
              AI Generate
            </Button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <AnimatePresence>
              {styleReferences.map((ref) => (
                <motion.div
                  key={ref.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative group flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img
                      src={ref.url}
                      alt={ref.name || 'Style reference'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={() => onRemoveStyleRef(ref.id)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {ref.type === 'generated' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[8px] text-center py-0.5">
                      AI
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Upload Reference */}
            <Button variant="outline" size="icon" className="w-16 h-16 flex-shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Staged Products Section */}
        <div className="flex-1 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Staged Products ({placedProducts.length})
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <AnimatePresence>
              {placedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex-shrink-0 cursor-pointer group"
                  onClick={() => onProductClick(product.id)}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted/30 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <p className="text-[10px] text-center mt-1 truncate max-w-16">{product.name}</p>
                  {product.price && (
                    <p className="text-[9px] text-center text-primary">{formatPrice(product.price)}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {placedProducts.length === 0 && (
              <p className="text-xs text-muted-foreground">No products staged yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
