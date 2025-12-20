import { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Palette, Package, ChevronDown, ChevronUp, ShoppingBag, Loader2, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { fetchFurnitureCatalog, CatalogFurnitureItem } from '@/services/catalogService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductDetailModal } from './ProductDetailModal';
import { Input } from '@/components/ui/input';

interface Asset {
  id: string;
  file_url: string;
  file_name: string;
  type: 'room' | 'style' | 'product';
}

interface AssetsPanelProps {
  projectId: string | null;
  onAssetSelect?: (asset: Asset) => void;
  onCatalogItemSelect?: (item: CatalogFurnitureItem) => void;
  stagedItemIds?: string[];
}

export type { CatalogFurnitureItem };

const ITEMS_PER_PAGE = 20;

export function AssetsPanel({ projectId, onAssetSelect, onCatalogItemSelect, stagedItemIds = [] }: AssetsPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogFurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogFurnitureItem | null>(null);
  const [activeTab, setActiveTab] = useState('project');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<CatalogFurnitureItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchAssets();
    }
    fetchCatalog();
  }, [projectId]);

  const fetchAssets = async () => {
    if (!projectId) return;
    
    setLoading(true);

    try {
      // Fetch room uploads
      const { data: rooms } = await supabase
        .from('room_uploads')
        .select('id, file_url, file_name')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Fetch style uploads
      const { data: styles } = await supabase
        .from('style_uploads')
        .select('id, file_url, file_name')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Fetch product items
      const { data: products } = await supabase
        .from('product_items')
        .select('id, image_url, name')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      const allAssets: Asset[] = [
        ...(rooms || []).map(r => ({ ...r, type: 'room' as const })),
        ...(styles || []).map(s => ({ ...s, type: 'style' as const })),
        ...(products || []).filter(p => p.image_url).map(p => ({ 
          id: p.id, 
          file_url: p.image_url!, 
          file_name: p.name,
          type: 'product' as const 
        })),
      ];

      setAssets(allAssets);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const items = await fetchFurnitureCatalog();
      setCatalogItems(items);
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedCatalogItem(null);
    onAssetSelect?.(asset);
  };

  const handleCatalogItemClick = (item: CatalogFurnitureItem) => {
    setPreviewItem(item);
  };

  const handleToggleStage = (item: CatalogFurnitureItem) => {
    setSelectedCatalogItem(item);
    setSelectedAsset(null);
    onCatalogItemSelect?.(item);
  };

  // Reset display count when search or category changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom && displayCount < filteredCatalogItems.length) {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredCatalogItems.length));
    }
  }, [displayCount]);

  if (!projectId) return null;

  const roomAssets = assets.filter(a => a.type === 'room');
  const styleAssets = assets.filter(a => a.type === 'style');
  const productAssets = assets.filter(a => a.type === 'product');

  // Get unique categories from catalog
  const categories = [...new Set(catalogItems.map(item => item.category))];
  
  // Filter by category and search query
  const filteredCatalogItems = catalogItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayedItems = filteredCatalogItems.slice(0, displayCount);
  const hasMore = displayCount < filteredCatalogItems.length;

  return (
    <div className="border-t border-border bg-card/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">
            Assets & Catalog
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {assets.length + catalogItems.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-3">
              <TabsTrigger value="project" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                Project ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="catalog" className="text-xs">
                <ShoppingBag className="h-3 w-3 mr-1" />
                Catalog ({catalogItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="mt-0">
              {loading ? (
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square skeleton rounded-lg" />
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No assets yet</p>
                </div>
              ) : (
                <div className="h-36 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {/* Room uploads */}
                    {roomAssets.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Image className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Room Photos ({roomAssets.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {roomAssets.map((asset) => (
                            <AssetThumbnail
                              key={asset.id}
                              asset={asset}
                              isSelected={selectedAsset?.id === asset.id}
                              onClick={() => handleAssetClick(asset)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Style uploads */}
                    {styleAssets.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Palette className="h-3 w-3 text-accent" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Style References ({styleAssets.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {styleAssets.map((asset) => (
                            <AssetThumbnail
                              key={asset.id}
                              asset={asset}
                              isSelected={selectedAsset?.id === asset.id}
                              onClick={() => handleAssetClick(asset)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {productAssets.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Package className="h-3 w-3 text-success" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Products ({productAssets.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {productAssets.map((asset) => (
                            <AssetThumbnail
                              key={asset.id}
                              asset={asset}
                              isSelected={selectedAsset?.id === asset.id}
                              onClick={() => handleAssetClick(asset)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="catalog" className="mt-0">
              {catalogLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search furniture..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 pl-7 pr-7 text-xs bg-muted/50 border-border/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-full transition-colors",
                        selectedCategory === null
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-full transition-colors",
                          selectedCategory === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Results count */}
                  <div className="text-[10px] text-muted-foreground">
                    Showing {displayedItems.length} of {filteredCatalogItems.length} items
                  </div>

                  {/* Scrollable grid with infinite scroll */}
                  <div 
                    className="h-40 overflow-y-auto" 
                    onScroll={handleScroll}
                    ref={scrollContainerRef}
                  >
                    {filteredCatalogItems.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No items found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {displayedItems.map((item) => (
                          <CatalogThumbnail
                            key={item.id}
                            item={item}
                            isSelected={stagedItemIds.includes(item.id)}
                            onClick={() => handleCatalogItemClick(item)}
                          />
                        ))}
                      </div>
                    )}
                    {hasMore && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        isStaged={previewItem ? stagedItemIds.includes(previewItem.id) : false}
        onToggleStage={handleToggleStage}
      />
    </div>
  );
}

interface AssetThumbnailProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
}

function AssetThumbnail({ asset, isSelected, onClick }: AssetThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
        'hover:scale-105 hover:shadow-lg',
        isSelected 
          ? 'border-primary ring-2 ring-primary/30' 
          : 'border-border/50 hover:border-primary/50'
      )}
    >
      <img
        src={asset.file_url}
        alt={asset.file_name}
        className="w-full h-full object-cover"
      />
      {/* Type indicator */}
      <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white">
        {asset.type === 'room' && <Image className="h-2.5 w-2.5" />}
        {asset.type === 'style' && <Palette className="h-2.5 w-2.5" />}
        {asset.type === 'product' && <Package className="h-2.5 w-2.5" />}
      </div>
    </button>
  );
}

interface CatalogThumbnailProps {
  item: CatalogFurnitureItem;
  isSelected: boolean;
  onClick: () => void;
}

function CatalogThumbnail({ item, isSelected, onClick }: CatalogThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all group',
        'hover:scale-105 hover:shadow-lg',
        isSelected 
          ? 'border-primary ring-2 ring-primary/30' 
          : 'border-border/50 hover:border-primary/50'
      )}
      title={`${item.name} - $${item.price}`}
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-full h-full object-cover"
      />
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-primary text-primary-foreground">
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {/* Category indicator */}
      <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/60 text-white">
        <ShoppingBag className="h-2.5 w-2.5" />
      </div>
      {/* Hover overlay with name */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
        <span className="text-[8px] text-white line-clamp-2 leading-tight">
          {item.name}
        </span>
      </div>
    </button>
  );
}
