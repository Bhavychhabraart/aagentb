import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Sparkles, Package, X } from 'lucide-react';
import { SelectiveEditCatalog } from './SelectiveEditCatalog';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { StagedFurnitureItem } from './FurnitureOverlay';
import { cn } from '@/lib/utils';

interface FurnitureReplacementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  furniture: StagedFurnitureItem | null;
  onReplace: (originalFurniture: StagedFurnitureItem, newProduct: CatalogFurnitureItem) => void;
  isProcessing?: boolean;
}

export function FurnitureReplacementModal({
  open,
  onOpenChange,
  furniture,
  onReplace,
  isProcessing = false,
}: FurnitureReplacementModalProps) {
  const [selectedReplacement, setSelectedReplacement] = useState<CatalogFurnitureItem | null>(null);

  const handleConfirm = () => {
    if (furniture && selectedReplacement) {
      onReplace(furniture, selectedReplacement);
    }
  };

  const handleClose = () => {
    setSelectedReplacement(null);
    onOpenChange(false);
  };

  if (!furniture) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Replace Furniture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current vs New Preview */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Current Item */}
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Current</p>
              <div className="aspect-square w-24 mx-auto rounded-lg overflow-hidden border border-border bg-background">
                {furniture.item_image_url ? (
                  <img
                    src={furniture.item_image_url}
                    alt={furniture.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium mt-2 truncate">{furniture.item_name}</p>
              <p className="text-xs text-muted-foreground">{furniture.item_category}</p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                selectedReplacement ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* New Item */}
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Replace With</p>
              <div className={cn(
                "aspect-square w-24 mx-auto rounded-lg overflow-hidden border-2 transition-colors bg-background",
                selectedReplacement ? "border-primary" : "border-dashed border-muted-foreground/30"
              )}>
                {selectedReplacement ? (
                  selectedReplacement.imageUrl ? (
                    <img
                      src={selectedReplacement.imageUrl}
                      alt={selectedReplacement.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-primary/50" />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground p-2">Select from catalog below</p>
                  </div>
                )}
              </div>
              {selectedReplacement ? (
                <>
                  <p className="text-sm font-medium mt-2 truncate">{selectedReplacement.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedReplacement.category}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Choose a replacement</p>
              )}
            </div>
          </div>

          {/* Catalog Picker */}
          <div className="border rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Select Replacement
            </p>
            <SelectiveEditCatalog
              selectedItem={selectedReplacement}
              onItemSelect={setSelectedReplacement}
            />
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p>
              <strong>How it works:</strong> AI will regenerate only the area where the current furniture 
              is located, replacing it with your selected product. The rest of the room stays unchanged.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            <X className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedReplacement || isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Replacing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Replace & Regenerate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
