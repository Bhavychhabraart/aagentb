import { useState, useEffect } from 'react';
import { Package, Image, Layout, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CatalogFurnitureItem } from '@/services/catalogService';

interface FloatingAssetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  stagedItems?: CatalogFurnitureItem[];
  onAssetClick?: (url: string) => void;
}

type AssetTab = 'staged' | 'uploads' | 'layouts';

export function FloatingAssetsPanel({
  isOpen,
  onClose,
  projectId,
  stagedItems = [],
  onAssetClick,
}: FloatingAssetsPanelProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('staged');
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploads, setUploads] = useState<{ id: string; file_url: string; file_name: string }[]>([]);
  const [layouts, setLayouts] = useState<{ id: string; thumbnail_url: string | null; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchAssets();
    }
  }, [isOpen, projectId]);

  const fetchAssets = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      // Fetch room uploads
      const { data: uploadData } = await supabase
        .from('room_uploads')
        .select('id, file_url, file_name')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (uploadData) setUploads(uploadData);

      // Fetch layouts
      const { data: layoutData } = await supabase
        .from('layouts')
        .select('id, thumbnail_url, name')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (layoutData) setLayouts(layoutData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'staged' as const, label: 'Staged', icon: Package, count: stagedItems.length },
    { id: 'uploads' as const, label: 'Uploads', icon: Image, count: uploads.length },
    { id: 'layouts' as const, label: 'Layouts', icon: Layout, count: layouts.length },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute left-4 top-24 z-20 w-64 animate-slide-in-right">
      <div className="glass-premium rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Assets</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-[10px] bg-muted px-1 rounded">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="h-48">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : activeTab === 'staged' ? (
                <div className="p-2 grid grid-cols-3 gap-1">
                  {stagedItems.length === 0 ? (
                    <div className="col-span-3 text-center py-6 text-muted-foreground">
                      <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No staged items</p>
                    </div>
                  ) : (
                    stagedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => item.imageUrl && onAssetClick?.(item.imageUrl)}
                        className="aspect-square rounded overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img
                          src={item.imageUrl || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))
                  )}
                </div>
              ) : activeTab === 'uploads' ? (
                <div className="p-2 grid grid-cols-3 gap-1">
                  {uploads.length === 0 ? (
                    <div className="col-span-3 text-center py-6 text-muted-foreground">
                      <Image className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No uploads</p>
                    </div>
                  ) : (
                    uploads.map((upload) => (
                      <button
                        key={upload.id}
                        onClick={() => onAssetClick?.(upload.file_url)}
                        className="aspect-square rounded overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img
                          src={upload.file_url}
                          alt={upload.file_name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {layouts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Layout className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No layouts</p>
                    </div>
                  ) : (
                    layouts.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => layout.thumbnail_url && onAssetClick?.(layout.thumbnail_url)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center">
                          {layout.thumbnail_url ? (
                            <img
                              src={layout.thumbnail_url}
                              alt={layout.name || 'Layout'}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Layout className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs truncate">{layout.name || 'Untitled Layout'}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
