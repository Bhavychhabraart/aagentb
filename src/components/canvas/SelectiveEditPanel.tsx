import { useState } from 'react';
import { Send, X, Loader2, Crop, Type, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectionRegion } from './SelectionOverlay';
import { SelectiveEditCatalog } from './SelectiveEditCatalog';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { cn } from '@/lib/utils';

interface SelectiveEditPanelProps {
  selection: SelectionRegion;
  onSubmit: (prompt: string, catalogItem?: CatalogFurnitureItem) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

type EditMode = 'prompt' | 'catalog';

export function SelectiveEditPanel({ 
  selection, 
  onSubmit, 
  onCancel, 
  isProcessing 
}: SelectiveEditPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('prompt');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogFurnitureItem | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (editMode === 'prompt') {
      if (prompt.trim()) {
        onSubmit(prompt.trim());
      }
    } else {
      if (selectedCatalogItem) {
        const finalPrompt = additionalInstructions.trim() 
          ? `Replace with ${selectedCatalogItem.name}. ${additionalInstructions.trim()}`
          : `Replace with ${selectedCatalogItem.name}`;
        onSubmit(finalPrompt, selectedCatalogItem);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const canSubmit = editMode === 'prompt' 
    ? prompt.trim().length > 0 
    : selectedCatalogItem !== null;

  return (
    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
      <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crop className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Selective Edit</h3>
              <p className="text-xs text-muted-foreground">
                Region: {Math.round(selection.x)}%, {Math.round(selection.y)}% → {Math.round(selection.width)}% × {Math.round(selection.height)}%
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Toggle */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode('prompt')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                editMode === 'prompt'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Type className="h-4 w-4" />
              Text Prompt
            </button>
            <button
              onClick={() => setEditMode('catalog')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                editMode === 'catalog'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Package className="h-4 w-4" />
              From Catalog
            </button>
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 pt-2">
          {editMode === 'prompt' ? (
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to change in this area... (e.g., 'Replace the sofa with a modern white sectional')"
              disabled={isProcessing}
              className="min-h-[80px] resize-none mb-3"
              autoFocus
            />
          ) : (
            <div className="mb-3">
              <SelectiveEditCatalog
                selectedItem={selectedCatalogItem}
                onItemSelect={setSelectedCatalogItem}
              />
              
              {/* Optional additional instructions */}
              <div className="mt-3">
                <Textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Optional: Additional instructions (e.g., 'Make it slightly larger' or 'Face towards the left')"
                  disabled={isProcessing}
                  className="min-h-[50px] resize-none text-xs"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {editMode === 'prompt' 
                ? 'Press Enter to apply, Esc to cancel'
                : selectedCatalogItem 
                  ? `Selected: ${selectedCatalogItem.name}`
                  : 'Select an item from the catalog'}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!canSubmit || isProcessing}
                className={cn(
                  "min-w-[100px]",
                  isProcessing && "opacity-80"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Apply Edit
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
