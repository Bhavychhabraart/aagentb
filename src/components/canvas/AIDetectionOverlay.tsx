import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ScanSearch, X, RefreshCw, Sparkles, RotateCcw, Package, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DetectionActionMenu } from './DetectionActionMenu';
import { CatalogFurnitureItem } from '@/services/catalogService';

export interface DetectedItem {
  id: string;
  label: string;
  x: number;
  y: number;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 space
}

interface ReplacementItem {
  name: string;
  imageUrl?: string;
}

interface AIDetectionOverlayProps {
  renderUrl: string;
  isActive: boolean;
  onClose: () => void;
  isMultiSelectMode: boolean;
  selectedItems: string[];
  onItemSelect: (itemId: string) => void;
  onItemAction: (item: DetectedItem, action: 'replace' | 'similar' | 'custom' | 'remove' | 'lock' | 'upload') => void;
  onBatchCatalogReplace?: (items: DetectedItem[]) => void;
  onBatchUpload?: (items: DetectedItem[]) => void;
  onBatchGenerate: (items: DetectedItem[]) => void;
  lockedItems?: string[];
  replacementItems?: Map<string, ReplacementItem>;
  onApplyFurnish?: () => void;
  onClearAll?: () => void;
  isFindingSimilar?: boolean;
}

export function AIDetectionOverlay({
  renderUrl,
  isActive,
  onClose,
  isMultiSelectMode,
  selectedItems,
  onItemSelect,
  onItemAction,
  onBatchGenerate,
  onBatchCatalogReplace,
  onBatchUpload,
  lockedItems = [],
  replacementItems = new Map(),
  onApplyFurnish,
  onClearAll,
  isFindingSimilar = false,
}: AIDetectionOverlayProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && renderUrl && detectedItems.length === 0) {
      runDetection();
    }
  }, [isActive, renderUrl]);

  const runDetection = async () => {
    if (!renderUrl) return;
    
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-furniture', {
        body: { roomImageUrl: renderUrl },
      });

      if (error) throw error;
      
      if (data?.items) {
        setDetectedItems(data.items);
        toast.success(`Detected ${data.items.length} items`);
      } else {
        setDetectedItems([]);
        toast.info('No items detected');
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to detect furniture');
    } finally {
      setIsDetecting(false);
    }
  };

  const getBoxStyle = (item: DetectedItem) => {
    if (!item.box_2d) {
      // Fallback to center point with default size
      return {
        left: `${item.x - 5}%`,
        top: `${item.y - 5}%`,
        width: '10%',
        height: '10%',
      };
    }

    const [ymin, xmin, ymax, xmax] = item.box_2d;
    return {
      left: `${xmin / 10}%`,
      top: `${ymin / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
    };
  };

  const handleItemClick = (item: DetectedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMultiSelectMode) {
      onItemSelect(item.id);
    } else {
      setActiveMenuId(activeMenuId === item.id ? null : item.id);
    }
  };

  const handleBatchAction = () => {
    const selectedDetections = detectedItems.filter(item => selectedItems.includes(item.id));
    if (selectedDetections.length > 0) {
      onBatchGenerate(selectedDetections);
    }
  };

  // Expose detected items for parent component
  const getDetectedItemById = (id: string) => detectedItems.find(item => item.id === id);

  if (!isActive) return null;

  const hasChanges = replacementItems.size > 0 || lockedItems.length > 0;

  return (
    <div className="absolute inset-0 z-20">
      {/* Controls header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="glass-premium rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Detection</span>
          </div>
          
          {isDetecting ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Detecting...</span>
            </div>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                {detectedItems.length} items found
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={runDetection}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Rescan
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Multi-select action bar */}
      {isMultiSelectMode && selectedItems.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="glass-premium rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              {onBatchCatalogReplace && (
                <Button
                  size="sm"
                  onClick={() => {
                    const selectedDetections = detectedItems.filter(item => selectedItems.includes(item.id));
                    onBatchCatalogReplace(selectedDetections);
                  }}
                  className="btn-glow text-xs"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Replace All from Catalog
                </Button>
              )}
              {onBatchUpload && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const selectedDetections = detectedItems.filter(item => selectedItems.includes(item.id));
                    onBatchUpload(selectedDetections);
                  }}
                  className="text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Replacement
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleBatchAction}
                variant="outline"
                className="text-xs"
              >
                Generate Replacements
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => selectedItems.forEach(id => onItemSelect(id))}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Furnish Action Bar - shows when replacements or locked items exist */}
      {hasChanges && !isMultiSelectMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="glass-premium rounded-xl px-4 py-3 flex items-center gap-4">
            <div className="text-sm flex items-center gap-3">
              {replacementItems.size > 0 && (
                <span>
                  <span className="text-amber-500 font-medium">{replacementItems.size}</span>
                  <span className="text-muted-foreground"> replacement{replacementItems.size > 1 ? 's' : ''}</span>
                </span>
              )}
              {lockedItems.length > 0 && (
                <span className="text-green-500">
                  <span className="font-medium">{lockedItems.length}</span> locked
                </span>
              )}
            </div>
            <Button onClick={onApplyFurnish} className="btn-glow">
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Furnish
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Detection overlay with loading */}
      {isDetecting && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-premium rounded-xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm">Analyzing furniture...</span>
          </div>
        </div>
      )}

      {/* Finding similar loading overlay */}
      {isFindingSimilar && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-premium rounded-xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Finding similar items...</p>
            <p className="text-xs text-muted-foreground">Analyzing visual characteristics</p>
          </div>
        </div>
      )}

      {/* Bounding boxes */}
      {!isDetecting && detectedItems.map((item) => {
        const style = getBoxStyle(item);
        const isHovered = hoveredItem === item.id;
        const isSelected = selectedItems.includes(item.id);
        const isLocked = lockedItems.includes(item.id);
        const hasReplacement = replacementItems.has(item.id);
        const replacement = replacementItems.get(item.id);

        return (
          <div key={item.id}>
            {/* Bounding box */}
            <div
              className={cn(
                'absolute border-2 rounded-sm cursor-pointer transition-all duration-200',
                isLocked
                  ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20' // GREEN for locked
                  : hasReplacement
                    ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/20' // AMBER for replacement
                    : isSelected
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20'
                      : isHovered
                        ? 'border-primary/80 bg-primary/10'
                        : 'border-cyan-400/60 hover:border-cyan-400'
              )}
              style={style}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={(e) => handleItemClick(item, e)}
            >
              {/* Label */}
              <div
                className={cn(
                  'absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all',
                  isLocked
                    ? 'bg-green-500 text-white'
                    : hasReplacement
                      ? 'bg-amber-500 text-white'
                      : isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isHovered
                          ? 'bg-cyan-500 text-white'
                          : 'bg-cyan-400/80 text-white'
                )}
              >
                {hasReplacement ? `→ ${replacement?.name}` : item.label}
                {isLocked && ' ✓'}
                {isMultiSelectMode && !isLocked && (
                  <span className="ml-1 opacity-70">
                    {isSelected ? '✓' : '○'}
                  </span>
                )}
              </div>

              {/* Center dot indicator */}
              <div 
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-lg',
                  isLocked ? 'bg-green-500' : hasReplacement ? 'bg-amber-500' : 'bg-cyan-400'
                )}
              />
            </div>

            {/* Action menu */}
            {activeMenuId === item.id && !isMultiSelectMode && (
              <DetectionActionMenu
                item={item}
                style={style}
                isLocked={isLocked}
                onAction={(action) => {
                  onItemAction(item, action);
                  setActiveMenuId(null);
                }}
                onClose={() => setActiveMenuId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
