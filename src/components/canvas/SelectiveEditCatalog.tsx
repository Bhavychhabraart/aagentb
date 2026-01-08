import { useState, useEffect, useMemo } from 'react';
import { Search, Check, Loader2, Library, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { fetchFurnitureCatalog, CatalogFurnitureItem } from '@/services/catalogService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CategoryNav } from '@/components/catalog/CategoryNav';
import { CATALOG_CATEGORIES } from '@/config/catalogCategories';

interface SelectiveEditCatalogProps {
  selectedItem: CatalogFurnitureItem | null;
  onItemSelect: (item: CatalogFurnitureItem | null) => void;
}

interface CustomFurnitureItem {
  id: string;
  catalog_item_id: string;
  item_name: string;
  item_category: string;
  item_description: string | null;
  item_image_url: string | null;
  item_price: number | null;
  project_id: string;
  created_at: string;
}

export function SelectiveEditCatalog({ selectedItem, onItemSelect }: SelectiveEditCatalogProps) {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<CatalogFurnitureItem[]>([]);
  const [customItems, setCustomItems] = useState<CustomFurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customLoading, setCustomLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('catalog');
  const [catalogDisplayLimit, setCatalogDisplayLimit] = useState(40);
  const [customDisplayLimit, setCustomDisplayLimit] = useState(40);

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

  useEffect(() => {
    const loadCustomItems = async () => {
      if (!user) {
        setCustomLoading(false);
        return;
      }
      
      setCustomLoading(true);
      try {
        const { data, error } = await supabase
          .from('staged_furniture')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCustomItems(data || []);
      } catch (error) {
        console.error('Failed to load custom items:', error);
      } finally {
        setCustomLoading(false);
      }
    };
    loadCustomItems();
  }, [user]);

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATALOG_CATEGORIES) {
      counts[cat.id] = catalog.filter(item => item.category === cat.id).length;
    }
    return counts;
  }, [catalog]);

  const filteredCatalogItems = catalog.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const filteredCustomItems = customItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.item_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCatalogItemClick = (item: CatalogFurnitureItem) => {
    if (selectedItem?.id === item.id) {
      onItemSelect(null);
    } else {
      onItemSelect(item);
    }
  };

  const handleCustomItemClick = (item: CustomFurnitureItem) => {
    // Convert custom item to CatalogFurnitureItem format
    const catalogFormat: CatalogFurnitureItem = {
      id: item.catalog_item_id,
      name: item.item_name,
      category: item.item_category,
      description: item.item_description || undefined,
      imageUrl: item.item_image_url || undefined,
      price: item.item_price || undefined,
      source: 'custom'
    };
    
    if (selectedItem?.id === catalogFormat.id) {
      onItemSelect(null);
    } else {
      onItemSelect(catalogFormat);
    }
  };

  const renderItemGrid = (items: CatalogFurnitureItem[], displayLimit: number, onLoadMore: () => void) => (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2 pr-3">
        {items.slice(0, displayLimit).map(item => (
          <button
            key={item.id}
            onClick={() => handleCatalogItemClick(item)}
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
            
            {selectedItem?.id === item.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
              <p className="text-[10px] text-white truncate">{item.name}</p>
            </div>
          </button>
        ))}
      </div>
      {items.length > displayLimit && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
        >
          Load More ({items.length - displayLimit} remaining)
        </button>
      )}
    </div>
  );

  const renderCustomItemGrid = () => (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2 pr-3">
        {filteredCustomItems.slice(0, customDisplayLimit).map(item => (
          <button
            key={item.id}
            onClick={() => handleCustomItemClick(item)}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
              "hover:ring-2 hover:ring-primary/50",
              selectedItem?.id === item.catalog_item_id
                ? "border-primary ring-2 ring-primary/30"
                : "border-border/50"
            )}
          >
            {item.item_image_url ? (
              <img
                src={item.item_image_url}
                alt={item.item_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No img</span>
              </div>
            )}
            
            {selectedItem?.id === item.catalog_item_id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
              <p className="text-[10px] text-white truncate">{item.item_name}</p>
            </div>
          </button>
        ))}
      </div>
      {filteredCustomItems.length > customDisplayLimit && (
        <button
          onClick={() => setCustomDisplayLimit(prev => prev + 40)}
          className="w-full py-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
        >
          Load More ({filteredCustomItems.length - customDisplayLimit} remaining)
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs for Catalog vs Custom */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="catalog" className="text-xs gap-1.5">
            <Package className="h-3 w-3" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs gap-1.5">
            <Library className="h-3 w-3" />
            Custom ({customItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Search and Category - shared */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'catalog' ? "Search catalog..." : "Search custom items..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Category Navigation */}
        <CategoryNav
          categories={CATALOG_CATEGORIES}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onCategorySelect={(cat) => {
            setSelectedCategory(cat);
            setSelectedSubcategory(null);
          }}
          onSubcategorySelect={(cat, subcat) => {
            setSelectedCategory(cat);
            setSelectedSubcategory(subcat);
          }}
          itemCounts={categoryItemCounts}
          totalCount={catalog.length}
          compact
        />

        {/* Catalog Tab Content */}
        <TabsContent value="catalog" className="mt-2">
          <ScrollArea className="h-[140px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCatalogItems.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8 text-xs text-muted-foreground">
                No items found
              </div>
            ) : (
              renderItemGrid(filteredCatalogItems, catalogDisplayLimit, () => setCatalogDisplayLimit(prev => prev + 40))
            )}
          </ScrollArea>
        </TabsContent>

        {/* Custom Tab Content */}
        <TabsContent value="custom" className="mt-2">
          <ScrollArea className="h-[140px]">
            {customLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCustomItems.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8 text-xs text-muted-foreground">
                {customItems.length === 0 ? "No custom items yet" : "No items match your search"}
              </div>
            ) : (
              renderCustomItemGrid()
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

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
            <p className="text-[10px] text-muted-foreground">
              {selectedItem.category}
              {selectedItem.source === 'custom' && ' • Custom'}
            </p>
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
