import { Check, Plus, Minus, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { formatINR } from '@/utils/formatCurrency';

interface ListViewProps {
  items: CatalogFurnitureItem[];
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
}

export function ListView({ items, selectedItems, onToggleItem, onPreviewItem }: ListViewProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <Card
            key={item.id}
            className={`group flex overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => onPreviewItem?.(item)}
          >
            {/* Image */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative bg-muted">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="font-medium text-sm sm:text-base truncate">{item.name}</h3>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {item.subcategory || item.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.brand && <span>{item.brand}</span>}
                  {item.subcategory && (
                    <>
                      <span>•</span>
                      <span>{item.subcategory}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <span className="text-lg font-bold text-primary">
                  {formatINR(item.price || 0)}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isSelected ? 'destructive' : 'default'}
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleItem(item);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Minus className="h-4 w-4" />
                        Remove
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Stage
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewItem?.(item);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
