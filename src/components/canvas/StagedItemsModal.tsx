import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { X, Move, FileText, Presentation, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StagedItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stagedItems: CatalogFurnitureItem[];
  onRemoveItem: (item: CatalogFurnitureItem) => void;
  onClearAll: () => void;
  onPositionFurniture: () => void;
  onOpenInvoice: () => void;
  onOpenPPT: () => void;
  canPosition: boolean;
}

export function StagedItemsModal({
  open,
  onOpenChange,
  stagedItems,
  onRemoveItem,
  onClearAll,
  onPositionFurniture,
  onOpenInvoice,
  onOpenPPT,
  canPosition,
}: StagedItemsModalProps) {
  const totalPrice = stagedItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Staged Furniture Items
            </DialogTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {stagedItems.length} item{stagedItems.length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm font-medium text-primary">
                ${totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-6">
            {stagedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No items staged yet.</p>
                <p className="text-sm mt-1">Use the catalog or select tool to add furniture.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stagedItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="group relative bg-muted/30 rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    {/* Image */}
                    <div className="aspect-square relative">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-muted/50">
                          No image
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <button
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-destructive"
                        onClick={() => onRemoveItem(item)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Info */}
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                      {item.price && (
                        <p className="text-sm font-medium text-primary mt-1">
                          ${item.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPositionFurniture}
              disabled={!canPosition || stagedItems.length === 0}
              className="flex-1 min-w-[140px]"
            >
              <Move className="h-4 w-4 mr-2" />
              Position on Render
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenInvoice();
              }}
              disabled={stagedItems.length === 0}
              className="flex-1 min-w-[140px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenPPT();
              }}
              disabled={stagedItems.length === 0}
              className="flex-1 min-w-[140px]"
            >
              <Presentation className="h-4 w-4 mr-2" />
              Generate PPT
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={stagedItems.length === 0}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
