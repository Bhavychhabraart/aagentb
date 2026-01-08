import { Check, Home, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { formatINR } from '@/utils/formatCurrency';

interface RealspaceViewProps {
  items: CatalogFurnitureItem[];
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
}

// Room context suggestions based on category
const getRoomContext = (category: string, subcategory?: string): string => {
  const contexts: Record<string, string> = {
    'Seating': 'Living Room',
    'Tables': 'Dining Room',
    'Storage': 'Bedroom',
    'Beds': 'Master Bedroom',
    'Lighting': 'Reading Nook',
    'Decor': 'Entryway',
    'Sofas': 'Living Room',
    'Chairs': 'Office',
    'Dining': 'Dining Room',
    'Office': 'Home Office',
  };
  return contexts[subcategory || ''] || contexts[category] || 'Living Space';
};

export function RealspaceView({ items, selectedItems, onToggleItem, onPreviewItem }: RealspaceViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const roomContext = getRoomContext(item.category, item.subcategory);
        
        return (
          <Card
            key={item.id}
            className={`group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              isSelected ? 'ring-2 ring-primary shadow-xl' : ''
            }`}
            onClick={() => onPreviewItem?.(item)}
          >
            {/* Room Context Image */}
            <div className="aspect-[16/10] relative bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
              {/* Simulated room background with product */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-stone-100/50 to-slate-200/50" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="max-w-[70%] max-h-[80%] object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              {/* Room context badge */}
              <Badge 
                variant="secondary" 
                className="absolute top-3 left-3 gap-1.5 bg-background/90 backdrop-blur-sm"
              >
                <Home className="h-3 w-3" />
                {roomContext}
              </Badge>
              
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
              )}

              {/* View in AR/3D hint */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm gap-1">
                  <Eye className="h-3 w-3" />
                  View Details
                </Badge>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3 border-t">
              <div>
                <h3 className="font-semibold text-base mb-1">{item.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {item.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xl font-bold text-primary">
                    {formatINR(item.price || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand && `By ${item.brand}`}
                  </p>
                </div>
                <Button
                  variant={isSelected ? 'secondary' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleItem(item);
                  }}
                >
                  {isSelected ? 'Remove' : 'Stage Item'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
