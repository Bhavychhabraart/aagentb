import { useState, useEffect } from 'react';
import { Image, Palette, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Asset {
  id: string;
  file_url: string;
  file_name: string;
  type: 'room' | 'style' | 'product';
}

interface AssetsPanelProps {
  projectId: string | null;
  onAssetSelect?: (asset: Asset) => void;
}

export function AssetsPanel({ projectId, onAssetSelect }: AssetsPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchAssets();
    }
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

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    onAssetSelect?.(asset);
  };

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'room': return <Image className="h-3 w-3" />;
      case 'style': return <Palette className="h-3 w-3" />;
      case 'product': return <Package className="h-3 w-3" />;
    }
  };

  const getAssetLabel = (type: Asset['type']) => {
    switch (type) {
      case 'room': return 'Room';
      case 'style': return 'Style';
      case 'product': return 'Product';
    }
  };

  if (!projectId) return null;

  const roomAssets = assets.filter(a => a.type === 'room');
  const styleAssets = assets.filter(a => a.type === 'style');
  const productAssets = assets.filter(a => a.type === 'product');

  return (
    <div className="border-t border-border bg-card/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">
            Project Assets
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {assets.length}
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
            <ScrollArea className="max-h-36">
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
          )}
        </div>
      )}
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
