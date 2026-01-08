import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { formatINR } from '@/utils/formatCurrency';

interface GridViewProps {
  items: CatalogFurnitureItem[];
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
}

export function GridView({ items, selectedItems, onToggleItem, onPreviewItem }: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <Card
            key={item.id}
            className={`group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              isSelected ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => onPreviewItem?.(item)}
          >
            <div className="aspect-square relative bg-muted">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-3 space-y-2">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
              <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-primary">
                  {formatINR(item.price || 0)}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {item.subcategory || item.category}
                </Badge>
              </div>
              <Button
                size="sm"
                variant={isSelected ? 'secondary' : 'default'}
                className="w-full text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleItem(item);
                }}
              >
                {isSelected ? 'Remove' : 'Stage'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
