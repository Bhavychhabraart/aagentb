import { useState, useEffect } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { fetchFurnitureCatalog, CatalogFurnitureItem } from '@/services/catalogService';

interface SelectiveEditCatalogProps {
  selectedItem: CatalogFurnitureItem | null;
  onItemSelect: (item: CatalogFurnitureItem | null) => void;
}

const CATEGORIES = ['All', 'Seating', 'Tables', 'Lighting', 'Bedroom', 'Storage', 'Decoration'];

export function SelectiveEditCatalog({ selectedItem, onItemSelect }: SelectiveEditCatalogProps) {
  const [catalog, setCatalog] = useState<CatalogFurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const loadCatalog = async () => {
      setIsLoading(true);
      try {
        const items = await fetchFurnitureCatalog();
        setCatalog(items);
      } catch (error) {
        console.error('Failed to load catalog:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const filteredItems = catalog.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (item: CatalogFurnitureItem) => {
    if (selectedItem?.id === item.id) {
      onItemSelect(null);
    } else {
      onItemSelect(item);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search and Category */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <ScrollArea className="h-[140px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8 text-xs text-muted-foreground">
            No items found
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 pr-3">
            {filteredItems.slice(0, 20).map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                  "hover:ring-2 hover:ring-primary/50",
                  selectedItem?.id === item.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/50"
                )}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No img</span>
                  </div>
                )}
                
                {/* Selected checkmark */}
                {selectedItem?.id === item.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                {/* Item name tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                  <p className="text-[10px] text-white truncate">{item.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Selected Item Preview */}
      {selectedItem && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          {selectedItem.imageUrl && (
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="h-10 w-10 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selectedItem.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedItem.category}</p>
          </div>
          <button
            onClick={() => onItemSelect(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
