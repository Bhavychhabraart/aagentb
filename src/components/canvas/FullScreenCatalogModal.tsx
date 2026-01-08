import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { X, Search, Loader2, Check, Plus, ShoppingBag, Maximize2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { CategoryNav } from '@/components/catalog/CategoryNav';
import { CATALOG_CATEGORIES } from '@/config/catalogCategories';
import { CatalogViewSwitcher, CatalogViewMode } from '@/components/catalog/CatalogViewSwitcher';
import { CatalogProductView } from '@/components/catalog/CatalogProductView';

interface FullScreenCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItems: CatalogFurnitureItem[];
  stagedItemIds: string[];
  onToggleStage: (item: CatalogFurnitureItem) => void;
  onPreviewItem: (item: CatalogFurnitureItem) => void;
  title?: string;
  subtitle?: string;
  selectionMode?: boolean; // When true, clicking selects instead of staging
  initialSearchQuery?: string; // Pre-fill search for similarity mode
  suggestedCategory?: string; // Pre-select category
  isLoading?: boolean; // Show loading state
  similarityBadge?: string; // Show "Similar to: X" badge
}

const ITEMS_PER_PAGE = 40;

export function FullScreenCatalogModal({
  isOpen,
  onClose,
  catalogItems,
  stagedItemIds,
  onToggleStage,
  onPreviewItem,
  title,
  subtitle,
  selectionMode = false,
  initialSearchQuery = '',
  suggestedCategory,
  isLoading = false,
  similarityBadge,
}: FullScreenCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(suggestedCategory || null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<CatalogViewMode>(() => {
    const saved = localStorage.getItem('catalogViewMode');
    return (saved as CatalogViewMode) || 'grid';
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('catalogViewMode', viewMode);
  }, [viewMode]);

  // Reset on open with initial values
  useEffect(() => {
    if (isOpen) {
      setDisplayCount(ITEMS_PER_PAGE);
      setSearchQuery(initialSearchQuery);
      setSelectedCategory(suggestedCategory || null);
      setSelectedSubcategory(null);
    }
  }, [isOpen, initialSearchQuery, suggestedCategory]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  // Calculate item counts per category
  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATALOG_CATEGORIES) {
      counts[cat.id] = catalogItems.filter(item => item.category === cat.id).length;
    }
    return counts;
  }, [catalogItems]);

  const filteredItems = catalogItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const displayedItems = filteredItems.slice(0, displayCount);
  const hasMore = displayCount < filteredItems.length;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    if (bottom && hasMore) {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredItems.length));
    }
  }, [hasMore, filteredItems.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background border-border flex flex-col">
        <VisuallyHidden.Root>
          <DialogTitle>Product Catalog</DialogTitle>
          <DialogDescription>Browse and select products from the furniture catalog</DialogDescription>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              {similarityBadge ? (
                <Sparkles className="h-5 w-5 text-amber-500" />
              ) : (
                <ShoppingBag className="h-5 w-5 text-primary" />
              )}
              <h2 className="text-lg font-semibold text-foreground">{title || 'Furniture Catalog'}</h2>
              <Badge variant="secondary">{catalogItems.length} items</Badge>
              {similarityBadge && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
                  Similar to: {similarityBadge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground ml-8">{subtitle}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          {/* Search and View Switcher */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, category, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-muted/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <CatalogViewSwitcher view={viewMode} onViewChange={setViewMode} />
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
          />

          {/* Results info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {displayedItems.length} of {filteredItems.length} items</span>
            <span>{stagedItemIds.length} items staged</span>
          </div>
        </div>

        {/* Grid */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
              <p className="text-lg">Finding similar items...</p>
              <p className="text-sm">Analyzing visual characteristics</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg">No items found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <CatalogProductView
              items={displayedItems}
              view={viewMode}
              selectedItems={stagedItemIds}
              onToggleItem={onToggleStage}
              onPreviewItem={onPreviewItem}
            />
          )}
          {hasMore && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Staged Items Summary Bar */}
        {stagedItemIds.length > 0 && !selectionMode && (
          <div className="shrink-0 p-4 bg-primary/5 border-t border-border">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {catalogItems
                    .filter(item => stagedItemIds.includes(item.id))
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-muted"
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                    ))}
                  {stagedItemIds.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{stagedItemIds.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {stagedItemIds.length} item{stagedItemIds.length !== 1 ? 's' : ''} staged
                </span>
              </div>
              <Button onClick={onClose} className="btn-glow">
                Done - Position Items
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface LargeCatalogCardProps {
  item: CatalogFurnitureItem;
  isStaged: boolean;
  onToggleStage: () => void;
  onPreview: () => void;
  selectionMode?: boolean;
}

function LargeCatalogCard({ item, isStaged, onToggleStage, onPreview, selectionMode = false }: LargeCatalogCardProps) {
  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all hover:border-primary/50">
      {/* Image */}
      <button
        onClick={onPreview}
        className="relative aspect-square w-full overflow-hidden bg-muted"
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {/* Staged indicator */}
        {isStaged && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
            <Check className="h-4 w-4" />
          </div>
        )}
        {/* Quick stage button on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="h-6 w-6 text-white" />
        </div>
      </button>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
            {item.name}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px]">
            {item.category}
          </Badge>
          {item.price > 0 && (
            <span className="text-sm font-semibold text-primary">
              ${item.price.toLocaleString()}
            </span>
          )}
        </div>
        {/* Stage/Select button */}
        <Button
          size="sm"
          variant={isStaged ? "secondary" : selectionMode ? "outline" : "default"}
          className={cn(
            "w-full gap-1.5",
            selectionMode && !isStaged && "border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStage();
          }}
        >
          {isStaged ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {selectionMode ? 'Selected' : 'Staged'}
            </>
          ) : (
            <>
              {selectionMode ? (
                <Sparkles className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {selectionMode ? 'Select as Replacement' : 'Add to Stage'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
