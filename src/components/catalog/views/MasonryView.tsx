import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { formatINR } from '@/utils/formatCurrency';

interface MasonryViewProps {
  items: CatalogFurnitureItem[];
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
}

// Simulated variable heights based on item index
const getAspectClass = (index: number): string => {
  const patterns = [
    'aspect-square',
    'aspect-[3/4]',
    'aspect-square',
    'aspect-[4/5]',
    'aspect-[3/4]',
    'aspect-square',
    'aspect-[5/6]',
    'aspect-square',
  ];
  return patterns[index % patterns.length];
};

export function MasonryView({ items, selectedItems, onToggleItem, onPreviewItem }: MasonryViewProps) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {items.map((item, index) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <Card
            key={item.id}
            className={`group break-inside-avoid overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
              isSelected ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => onPreviewItem?.(item)}
          >
            <div className={`${getAspectClass(index)} relative bg-muted`}>
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute top-2 right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="font-semibold text-sm mb-1">{item.name}</p>
                  <p className="text-white/80 text-lg font-bold mb-3">
                    {formatINR(item.price || 0)}
                  </p>
                  <Button
                    size="sm"
                    variant={isSelected ? 'secondary' : 'default'}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleItem(item);
                    }}
                  >
                    {isSelected ? 'Remove' : 'Stage Item'}
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
