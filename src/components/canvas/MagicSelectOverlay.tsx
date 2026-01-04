import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MagicSelectActionPanel } from './MagicSelectActionPanel';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { toast } from 'sonner';

export interface MagicSelection {
  id: string;
  label: string;
  maskImageUrl: string;
  clickPosition: { x: number; y: number };
  boundingBox?: { x1: number; y1: number; x2: number; y2: number };
  replacement?: {
    type: 'catalog' | 'upload' | 'custom';
    item: CatalogFurnitureItem | { name: string; imageUrl: string };
  };
}

interface MagicSelectOverlayProps {
  renderUrl: string;
  isActive: boolean;
  onClose: () => void;
  selections: MagicSelection[];
  onAddSelection: (selection: MagicSelection) => void;
  onRemoveSelection: (selectionId: string) => void;
  onClearSelections: () => void;
  onUpdateReplacement: (selectionId: string, replacement: MagicSelection['replacement']) => void;
  onApplyReplacements: () => void;
  isIdentifying: boolean;
  isApplying: boolean;
  catalogItems: CatalogFurnitureItem[];
  customLibraryItems: Array<{ id: string; name: string; imageUrl: string }>;
  onIdentifyAtClick: (x: number, y: number) => Promise<void>;
}

export function MagicSelectOverlay({
  renderUrl,
  isActive,
  onClose,
  selections,
  onAddSelection,
  onRemoveSelection,
  onClearSelections,
  onUpdateReplacement,
  onApplyReplacements,
  isIdentifying,
  isApplying,
  catalogItems,
  customLibraryItems,
  onIdentifyAtClick,
}: MagicSelectOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [activeSelectionId, setActiveSelectionId] = useState<string | null>(null);

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isIdentifying || isApplying) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    await onIdentifyAtClick(x, y);
  };

  const handleSelectionClick = (selectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSelectionId(selectionId);
    setShowActionPanel(true);
  };

  const handleReplacement = (selectionId: string, replacement: MagicSelection['replacement']) => {
    onUpdateReplacement(selectionId, replacement);
    setShowActionPanel(false);
    setActiveSelectionId(null);
  };

  const handleApply = () => {
    const selectionsWithReplacements = selections.filter(s => s.replacement);
    if (selectionsWithReplacements.length === 0) {
      toast.error('Please select replacements for at least one item');
      return;
    }
    onApplyReplacements();
  };

  if (!isActive) return null;

  const hasReplacements = selections.some(s => s.replacement);

  return (
    <div className="absolute inset-0 z-40">
      {/* Click Area Overlay */}
      <div 
        ref={containerRef}
        className={cn(
          "absolute inset-0 transition-all duration-200",
          isIdentifying ? "cursor-wait" : "cursor-crosshair"
        )}
        onClick={handleImageClick}
      >
        {/* Masked overlays for each selection */}
        {selections.map((selection, index) => (
          <div
            key={selection.id}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${selection.maskImageUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              mixBlendMode: 'multiply',
            }}
          >
            {/* Clickable badge for the selection */}
            <button
              onClick={(e) => handleSelectionClick(selection.id, e)}
              className={cn(
                "absolute pointer-events-auto",
                "w-7 h-7 rounded-full flex items-center justify-center",
                "text-xs font-bold text-white shadow-lg",
                "transition-all duration-200 hover:scale-110",
                selection.replacement 
                  ? "bg-green-500 border-2 border-green-300" 
                  : "bg-primary border-2 border-primary-foreground",
                activeSelectionId === selection.id && "ring-2 ring-white ring-offset-2"
              )}
              style={{
                left: `${selection.clickPosition.x}%`,
                top: `${selection.clickPosition.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {index + 1}
            </button>
          </div>
        ))}
      </div>

      {/* Identifying Loader */}
      {isIdentifying && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm pointer-events-none">
          <div className="glass-premium rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Identifying furniture...</span>
          </div>
        </div>
      )}

      {/* Applying Loader */}
      {isApplying && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-50">
          <div className="glass-premium rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">Applying replacements...</p>
              <p className="text-sm text-muted-foreground mt-1">Generating new render with selected items</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar with Tool Info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-premium rounded-xl px-4 py-2 flex items-center gap-3">
          <Wand2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Magic Select</span>
          <span className="text-xs text-muted-foreground">
            Click on furniture to select
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {selections.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="glass-premium rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {selections.slice(0, 3).map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-background",
                      s.replacement ? "bg-green-500" : "bg-primary"
                    )}
                  >
                    {i + 1}
                  </div>
                ))}
                {selections.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                    +{selections.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm">
                {selections.length} item{selections.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelections}
                disabled={isApplying}
              >
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!hasReplacements || isApplying}
                className="btn-glow"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  `Apply ${selections.filter(s => s.replacement).length} Replacement${selections.filter(s => s.replacement).length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Panel for selecting replacement */}
      {showActionPanel && activeSelectionId && (
        <MagicSelectActionPanel
          selection={selections.find(s => s.id === activeSelectionId)!}
          onClose={() => {
            setShowActionPanel(false);
            setActiveSelectionId(null);
          }}
          onSelectCatalog={(item) => handleReplacement(activeSelectionId, { type: 'catalog', item })}
          onSelectUpload={(item) => handleReplacement(activeSelectionId, { type: 'upload', item })}
          onSelectCustom={(item) => handleReplacement(activeSelectionId, { type: 'custom', item })}
          onRemove={() => {
            onRemoveSelection(activeSelectionId);
            setShowActionPanel(false);
            setActiveSelectionId(null);
          }}
          catalogItems={catalogItems}
          customLibraryItems={customLibraryItems}
        />
      )}
    </div>
  );
}
