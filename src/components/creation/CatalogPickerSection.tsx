import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Check, Package } from 'lucide-react';
import { fetchFurnitureCatalog, CatalogFurnitureItem } from '@/services/catalogService';
import { cn } from '@/lib/utils';
import { formatINR } from '@/utils/formatCurrency';

interface CatalogPickerSectionProps {
  onSelect: (item: CatalogFurnitureItem) => void;
  selectedItemId: string | null;
}

const CATEGORIES = [
  'All', 'Seating', 'Tables', 'Storage', 'Lighting', 'Bedroom', 
  'Outdoor', 'Hospitality', 'Walls', 'Mosaics', 'Decor', 'Art', 'Rugs', 'Decoration'
];

export function CatalogPickerSection({ onSelect, selectedItemId }: CatalogPickerSectionProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogFurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const items = await fetchFurnitureCatalog();
      setCatalogItems(items);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search catalog..."
          className="pl-9 bg-muted/50"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer transition-colors"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Items Grid */}
      <ScrollArea className="h-[280px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pr-4">
            {filteredItems.slice(0, 20).map(item => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-[1.02]",
                  selectedItemId === item.id 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-white/70">{formatINR(item.price)}</p>
                  </div>
                </div>

                {/* Selected checkmark */}
                {selectedItemId === item.id && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Vendor badge */}
                {item.isVendorProduct && (
                  <Badge className="absolute top-2 left-2 text-[10px] py-0 px-1.5 bg-secondary">
                    Vendor
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
