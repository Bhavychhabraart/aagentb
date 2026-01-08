import { Check, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { formatINR } from '@/utils/formatCurrency';

interface MagazineViewProps {
  items: CatalogFurnitureItem[];
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
}

export function MagazineView({ items, selectedItems, onToggleItem, onPreviewItem }: MagazineViewProps) {
  if (items.length === 0) return null;

  const [heroItem, ...restItems] = items;
  const isHeroSelected = selectedItems.includes(heroItem.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Hero Product */}
      <Card
        className={`lg:col-span-2 lg:row-span-2 group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl ${
          isHeroSelected ? 'ring-2 ring-primary shadow-lg' : ''
        }`}
        onClick={() => onPreviewItem?.(heroItem)}
      >
        <div className="aspect-[4/3] lg:aspect-auto lg:h-full relative bg-muted">
          <img
            src={heroItem.imageUrl}
            alt={heroItem.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary text-primary-foreground gap-1">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          </div>
          {isHeroSelected && (
            <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Badge variant="secondary" className="mb-2 text-xs">
              {heroItem.subcategory || heroItem.category}
            </Badge>
            <h3 className="text-2xl font-bold mb-2">{heroItem.name}</h3>
            <p className="text-white/80 text-sm mb-4 line-clamp-2">{heroItem.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatINR(heroItem.price || 0)}</span>
              <Button
                size="lg"
                variant={isHeroSelected ? 'secondary' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleItem(heroItem);
                }}
              >
                {isHeroSelected ? 'Remove' : 'Stage Item'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Supporting Items */}
      {restItems.slice(0, 6).map((item) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <Card
            key={item.id}
            className={`group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
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
            <div className="p-3 space-y-1.5">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">
                  {formatINR(item.price || 0)}
                </span>
                <Button
                  size="sm"
                  variant={isSelected ? 'secondary' : 'default'}
                  className="text-xs h-7 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleItem(item);
                  }}
                >
                  {isSelected ? 'Remove' : 'Stage'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Remaining items in smaller grid */}
      {restItems.length > 6 && (
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {restItems.slice(6).map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <Card
                key={item.id}
                className={`group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
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
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs font-semibold text-primary">{formatINR(item.price || 0)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
