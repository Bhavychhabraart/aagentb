import { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Palette, Package, ChevronDown, ChevronUp, ShoppingBag, Loader2, Search, X, Maximize2, Sparkles, Library, ExternalLink, Plus, Download } from 'lucide-react';
import { exportCatalogToCSV } from '@/utils/exportCatalogCSV';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { fetchFurnitureCatalog, CatalogFurnitureItem } from '@/services/catalogService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductDetailModal } from './ProductDetailModal';
import { FullScreenCatalogModal } from './FullScreenCatalogModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  onCustomItemSelect?: (item: CatalogFurnitureItem) => void;
  stagedItemIds?: string[];
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

export type { CatalogFurnitureItem };

const ITEMS_PER_PAGE = 20;

export function AssetsPanel({ projectId, onAssetSelect, onCatalogItemSelect, onCustomItemSelect, stagedItemIds = [] }: AssetsPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogFurnitureItem[]>([]);
  const [customItems, setCustomItems] = useState<CustomFurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [customLoading, setCustomLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogFurnitureItem | null>(null);
  const [activeTab, setActiveTab] = useState('project');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<CatalogFurnitureItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [selectedCustomCategory, setSelectedCustomCategory] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchAssets();
    }
    fetchCatalog();
    fetchCustomItems();
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

  const fetchCustomItems = async () => {
    setCustomLoading(true);
    try {
      const { data, error } = await supabase
        .from('staged_furniture')
        .select('*')
        .like('catalog_item_id', 'custom-%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Remove duplicates based on catalog_item_id (keep most recent)
      const uniqueItems = data?.reduce((acc: CustomFurnitureItem[], item) => {
        if (!acc.find(i => i.catalog_item_id === item.catalog_item_id)) {
          acc.push(item);
        }
        return acc;
      }, []) || [];
      
      setCustomItems(uniqueItems);
    } catch (error) {
      console.error('Failed to fetch custom items:', error);
    } finally {
      setCustomLoading(false);
    }
  };

  const handleCustomItemToggle = (item: CustomFurnitureItem) => {
    // Convert custom item to CatalogFurnitureItem format for staging
    const catalogItem: CatalogFurnitureItem = {
      id: item.catalog_item_id,
      name: item.item_name,
      category: item.item_category,
      description: item.item_description || '',
      imageUrl: item.item_image_url || undefined,
      price: item.item_price || 0,
    };
    
    // Use the custom item select handler if provided, otherwise fall back to catalog handler
    if (onCustomItemSelect) {
      onCustomItemSelect(catalogItem);
    } else if (onCatalogItemSelect) {
      onCatalogItemSelect(catalogItem);
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
  
  // Get unique categories from custom items
  const customCategories = [...new Set(customItems.map(item => item.item_category))];
  
  // Filter by category and search query
  const filteredCatalogItems = catalogItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter custom items
  const filteredCustomItems = customItems.filter(item => {
    const matchesCategory = !selectedCustomCategory || item.item_category === selectedCustomCategory;
    const matchesSearch = !customSearchQuery || 
      item.item_name.toLowerCase().includes(customSearchQuery.toLowerCase()) ||
      item.item_category.toLowerCase().includes(customSearchQuery.toLowerCase());
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
            <TabsList className="w-full grid grid-cols-4 mb-3">
              <TabsTrigger value="project" className="text-xs px-1">
                <Package className="h-3 w-3 mr-0.5" />
                <span className="hidden sm:inline">Project</span>
              </TabsTrigger>
              <TabsTrigger value="catalog" className="text-xs px-1">
                <ShoppingBag className="h-3 w-3 mr-0.5" />
                <span className="hidden sm:inline">Catalog</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs px-1">
                <Sparkles className="h-3 w-3 mr-0.5" />
                <span className="hidden sm:inline">Custom</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="text-xs px-1">
                <Library className="h-3 w-3 mr-0.5" />
                <span className="hidden sm:inline">Library</span>
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
                  {/* Search bar with expand button */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => exportCatalogToCSV(catalogItems)}
                      title="Download catalog as CSV"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setIsFullScreenOpen(true)}
                      title="Expand catalog"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
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

            {/* Custom Items Tab */}
            <TabsContent value="custom" className="mt-0">
              {customLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : customItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No custom furniture yet</p>
                  <p className="text-[10px] mt-1">Create custom furniture in the Library</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search custom items..."
                      value={customSearchQuery}
                      onChange={(e) => setCustomSearchQuery(e.target.value)}
                      className="h-7 pl-7 pr-7 text-xs bg-muted/50 border-border/50"
                    />
                    {customSearchQuery && (
                      <button
                        onClick={() => setCustomSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => setSelectedCustomCategory(null)}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-full transition-colors",
                        selectedCustomCategory === null
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      All
                    </button>
                    {customCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCustomCategory(cat)}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded-full transition-colors",
                          selectedCustomCategory === cat
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
                    {filteredCustomItems.length} custom item{filteredCustomItems.length !== 1 ? 's' : ''}
                  </div>

                  {/* Grid of custom items */}
                  <div className="h-40 overflow-y-auto">
                    {filteredCustomItems.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No items found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {filteredCustomItems.map((item) => (
                          <CustomItemThumbnail
                            key={item.id}
                            item={item}
                            isStaged={stagedItemIds.includes(item.catalog_item_id)}
                            onClick={() => handleCustomItemToggle(item)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library" className="mt-0">
              <div className="text-center py-6">
                <Library className="h-10 w-10 mx-auto mb-3 text-primary" />
                <h3 className="font-medium text-sm mb-2">Custom Furniture Library</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  View all your custom furniture in full-screen mode with advanced tools.
                </p>
                <Button 
                  onClick={() => navigate('/custom-furniture')} 
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Library
                </Button>
              </div>
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

      {/* Full Screen Catalog Modal */}
      <FullScreenCatalogModal
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        catalogItems={catalogItems}
        stagedItemIds={stagedItemIds}
        onToggleStage={handleToggleStage}
        onPreviewItem={(item) => {
          setPreviewItem(item);
        }}
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

interface CustomItemThumbnailProps {
  item: CustomFurnitureItem;
  isStaged: boolean;
  onClick: () => void;
}

function CustomItemThumbnail({ item, isStaged, onClick }: CustomItemThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all group',
        'hover:scale-105 hover:shadow-lg',
        isStaged 
          ? 'border-primary ring-2 ring-primary/30' 
          : 'border-border/50 hover:border-amber-500/50'
      )}
      title={`${item.item_name} - Click to ${isStaged ? 'remove from' : 'add to'} staging`}
    >
      <img
        src={item.item_image_url || '/placeholder.svg'}
        alt={item.item_name}
        className="w-full h-full object-cover"
      />
      {/* Custom badge */}
      <div className="absolute top-0.5 left-0.5 p-0.5 rounded bg-amber-500/90 text-white">
        <Sparkles className="h-2.5 w-2.5" />
      </div>
      {/* Staged checkmark */}
      {isStaged && (
        <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-primary text-primary-foreground">
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 gap-1">
        <span className="text-[8px] text-white line-clamp-2 leading-tight text-center">
          {item.item_name}
        </span>
        <span className="text-[8px] text-white/80">
          {isStaged ? 'Click to remove' : 'Click to stage'}
        </span>
      </div>
    </button>
  );
}