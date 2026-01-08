import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Check, Package } from 'lucide-react';
import { fetchFurnitureCatalog, CatalogFurnitureItem } from '@/services/catalogService';
import { cn } from '@/lib/utils';
import { formatINR } from '@/utils/formatCurrency';
import { CategoryNav } from '@/components/catalog/CategoryNav';
import { CATALOG_CATEGORIES } from '@/config/catalogCategories';
import { Badge } from '@/components/ui/badge';
import { CatalogViewSwitcher, CatalogViewMode } from '@/components/catalog/CatalogViewSwitcher';
import { CatalogProductView } from '@/components/catalog/CatalogProductView';

interface CatalogPickerSectionProps {
  onSelect: (item: CatalogFurnitureItem) => void;
  selectedItemId: string | null;
}

export function CatalogPickerSection({ onSelect, selectedItemId }: CatalogPickerSectionProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogFurnitureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');

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

  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATALOG_CATEGORIES) {
      counts[cat.id] = catalogItems.filter(item => item.category === cat.id).length;
    }
    return counts;
  }, [catalogItems]);

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
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
      {/* Search & View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog..."
            className="pl-9 bg-muted/50"
          />
        </div>
        <CatalogViewSwitcher view={viewMode} onViewChange={setViewMode} compact />
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
        totalCount={catalogItems.length}
        compact
      />

      {/* Items View */}
      <ScrollArea className="h-[350px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="pr-4">
            <CatalogProductView
              items={filteredItems.slice(0, 40)}
              view={viewMode}
              selectedItems={selectedItemId ? [selectedItemId] : []}
              onToggleItem={onSelect}
              onPreviewItem={onSelect}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
