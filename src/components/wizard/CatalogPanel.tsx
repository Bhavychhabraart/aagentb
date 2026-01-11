import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, ChevronLeft, ChevronRight, Filter, 
  Grid3X3, List, SlidersHorizontal, Loader2, Plus,
  Sofa, Lightbulb, Sun, Palette, Building, Layers, Square
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CategoryTree } from './CategoryTree';
import { CatalogProductCard } from './CatalogProductCard';
import { 
  BENTCHAIR_CATEGORY_TREE, 
  fetchProductsByCategory, 
  searchProducts,
  BentChairProduct,
  getCategoryPath,
} from '@/services/bentchairCatalogService';
import { CategoryNode } from '@/types/catalog';
import { cn } from '@/lib/utils';

interface CatalogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddProduct: (product: BentChairProduct) => void;
  onOpenCustomProduct?: () => void;
}

const QUICK_TABS = [
  { id: 'all', name: 'All', icon: Grid3X3 },
  { id: 'furniture', name: 'Furniture', icon: Sofa },
  { id: 'lighting', name: 'Lighting', icon: Lightbulb },
  { id: 'outdoor', name: 'Outdoor', icon: Sun },
  { id: 'decor', name: 'Decor', icon: Palette },
];

export function CatalogPanel({ 
  isOpen, 
  onToggle, 
  onAddProduct,
  onOpenCustomProduct 
}: CatalogPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('furniture');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['furniture']));
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<BentChairProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch products when category changes
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setPage(1);
      
      try {
        const slug = selectedCategorySlug || (activeTab !== 'all' ? activeTab : 'furniture');
        const result = await fetchProductsByCategory(slug, 1, 24);
        setProducts(result.products);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategorySlug, activeTab]);

  // Search products
  useEffect(() => {
    if (!searchQuery.trim()) return;
    
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchProducts(searchQuery, { category: selectedCategorySlug });
        setProducts(results);
        setHasMore(false);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategorySlug]);

  const handleSelectCategory = useCallback((categoryId: string, categorySlug: string) => {
    setSelectedCategory(categoryId);
    setSelectedCategorySlug(categorySlug);
    setSearchQuery('');
  }, []);

  const handleToggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value !== 'all') {
      setSelectedCategory(value);
      setSelectedCategorySlug(value);
      setExpandedCategories(new Set([value]));
    } else {
      setSelectedCategory(null);
      setSelectedCategorySlug('furniture');
    }
  };

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const slug = selectedCategorySlug || 'furniture';
      const result = await fetchProductsByCategory(slug, page + 1, 24);
      setProducts(prev => [...prev, ...result.products]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryPath = selectedCategory ? getCategoryPath(selectedCategory) : [];

  const filteredCategories = useMemo(() => {
    if (activeTab === 'all') return BENTCHAIR_CATEGORY_TREE;
    return BENTCHAIR_CATEGORY_TREE.filter(cat => cat.id === activeTab);
  }, [activeTab]);

  return (
    <>
      {/* Toggle Button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={onToggle}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-r-lg p-3 shadow-lg hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-card border-r border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Furniture Catalog</h2>
                <Button variant="ghost" size="icon" onClick={onToggle}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1">
                  {QUICK_TABS.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-1 min-w-[60px] text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <tab.icon className="h-3 w-3 mr-1" />
                      {tab.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9 pr-9 bg-muted/50 border-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Breadcrumb */}
            {categoryPath.length > 0 && (
              <div className="px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
                  <button 
                    onClick={() => { setSelectedCategory(null); setSelectedCategorySlug('furniture'); }}
                    className="hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    All
                  </button>
                  {categoryPath.map((cat, idx) => (
                    <React.Fragment key={cat.id}>
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      <button
                        onClick={() => handleSelectCategory(cat.id, cat.slug)}
                        className={cn(
                          "hover:text-foreground transition-colors whitespace-nowrap",
                          idx === categoryPath.length - 1 && "text-foreground font-medium"
                        )}
                      >
                        {cat.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Category Tree */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Categories
                    </h3>
                  </div>
                  <CategoryTree
                    categories={filteredCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    expandedCategories={expandedCategories}
                    onToggleExpand={handleToggleExpand}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Products */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Products {products.length > 0 && `(${products.length})`}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "p-1 rounded transition-colors",
                          viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                      >
                        <Grid3X3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "p-1 rounded transition-colors",
                          viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isLoading && products.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No products found
                    </div>
                  ) : (
                    <div className={cn(
                      "gap-3",
                      viewMode === 'grid' ? "grid grid-cols-2" : "flex flex-col"
                    )}>
                      {products.map((product) => (
                        <CatalogProductCard
                          key={product.id}
                          product={product}
                          onAddToCanvas={onAddProduct}
                          compact={viewMode === 'grid'}
                        />
                      ))}
                    </div>
                  )}

                  {/* Load More */}
                  {hasMore && products.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Load More
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={onOpenCustomProduct}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Product
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
