import { useState, useEffect } from 'react';
import { Send, X, Loader2, Crop, Type, Package, Paintbrush, Upload, Eye, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectionRegion } from './SelectionOverlay';
import { SelectiveEditCatalog } from './SelectiveEditCatalog';
import { SelectiveEditFinishes } from './SelectiveEditFinishes';
import { SelectiveEditUploader } from './SelectiveEditUploader';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { FinishItem } from '@/services/finishesLibrary';
import { cn } from '@/lib/utils';
import { generateSelectionPreview } from '@/utils/generateSelectionMask';

interface SelectiveEditPanelProps {
  selection: SelectionRegion;
  renderUrl: string; // Current render URL for preview generation
  onSubmit: (prompt: string, catalogItem?: CatalogFurnitureItem, referenceImageUrl?: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

type EditMode = 'prompt' | 'catalog' | 'finish' | 'upload' | 'erase';

export function SelectiveEditPanel({ 
  selection, 
  renderUrl,
  onSubmit, 
  onCancel, 
  isProcessing 
}: SelectiveEditPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('prompt');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogFurnitureItem | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<FinishItem | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate selection preview when component mounts or selection changes
  useEffect(() => {
    if (renderUrl && selection) {
      generateSelectionPreview(renderUrl, selection, 160)
        .then(setPreviewUrl)
        .catch(err => console.error('Failed to generate preview:', err));
    }
  }, [renderUrl, selection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (editMode === 'prompt') {
      if (prompt.trim()) {
        onSubmit(prompt.trim());
      }
    } else if (editMode === 'catalog') {
      if (selectedCatalogItem) {
        const finalPrompt = additionalInstructions.trim() 
          ? `Replace with ${selectedCatalogItem.name}. ${additionalInstructions.trim()}`
          : `Replace with ${selectedCatalogItem.name}`;
        onSubmit(finalPrompt, selectedCatalogItem);
      }
    } else if (editMode === 'finish') {
      if (selectedFinish) {
        const finalPrompt = additionalInstructions.trim()
          ? `Apply ${selectedFinish.name} (${selectedFinish.category}) finish. ${additionalInstructions.trim()}`
          : `Apply ${selectedFinish.name} (${selectedFinish.category}) finish to this area`;
        onSubmit(finalPrompt);
      }
    } else if (editMode === 'upload') {
      if (uploadedImageUrls.length > 0) {
        const finalPrompt = additionalInstructions.trim()
          ? `Use these ${uploadedImageUrls.length} reference image(s) to modify the selected area. ${additionalInstructions.trim()}`
          : `Apply the uploaded reference image(s) to this area`;
        // Pass the first image URL as the primary reference (edge function will receive all via array)
        onSubmit(finalPrompt, undefined, uploadedImageUrls[0]);
      }
    } else if (editMode === 'erase') {
      const finalPrompt = additionalInstructions.trim()
        ? `Remove this element and fill with matching background. ${additionalInstructions.trim()}`
        : 'Remove this element and fill with matching background that blends naturally with the surroundings';
      onSubmit(finalPrompt);
    }
  };

  // Only allow Enter key to submit in prompt mode (text input)
  // For other modes, require explicit button click to prevent accidental submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    
    // Only auto-submit on Enter in prompt mode
    if (e.key === 'Enter' && !e.shiftKey && editMode === 'prompt') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSubmit = editMode === 'prompt' 
    ? prompt.trim().length > 0 
    : editMode === 'catalog'
      ? selectedCatalogItem !== null
      : editMode === 'finish'
        ? selectedFinish !== null
        : editMode === 'erase'
          ? true // Erase is always ready
          : uploadedImageUrls.length > 0;

  return (
    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
      <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Header with Selection Preview */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          {/* Selection Preview Thumbnail */}
          {previewUrl && (
            <div className="relative shrink-0">
              <div className="w-14 h-10 rounded-md overflow-hidden border border-border bg-muted">
                <img 
                  src={previewUrl} 
                  alt="Selection preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <Eye className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Crop className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground">Selective Edit</h3>
              <p className="text-xs text-muted-foreground truncate">
                {Math.round(selection.width)}% × {Math.round(selection.height)}% area selected
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Toggle */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-1">
            <button
              onClick={() => setEditMode('prompt')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors",
                editMode === 'prompt'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Type className="h-3 w-3" />
              Prompt
            </button>
            <button
              onClick={() => setEditMode('catalog')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors",
                editMode === 'catalog'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Package className="h-3 w-3" />
              Product
            </button>
            <button
              onClick={() => setEditMode('finish')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors",
                editMode === 'finish'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Paintbrush className="h-3 w-3" />
              Finish
            </button>
            <button
              onClick={() => setEditMode('upload')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors",
                editMode === 'upload'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Upload className="h-3 w-3" />
              Upload
            </button>
            <button
              onClick={() => setEditMode('erase')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors",
                editMode === 'erase'
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Eraser className="h-3 w-3" />
              Erase
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pt-2">
          {editMode === 'prompt' && (
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to change in this area... (e.g., 'Replace the sofa with a modern white sectional')"
              disabled={isProcessing}
              className="min-h-[80px] resize-none mb-3"
              autoFocus
            />
          )}
          
          {editMode === 'catalog' && (
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
                  placeholder="Optional: Additional instructions (e.g., 'Make it slightly larger' or 'Face towards the left')"
                  disabled={isProcessing}
                  className="min-h-[50px] resize-none text-xs"
                />
              </div>
            </div>
          )}

          {editMode === 'finish' && (
            <div className="mb-3">
              <SelectiveEditFinishes
                selectedFinish={selectedFinish}
                onFinishSelect={setSelectedFinish}
              />
              
              {/* Optional additional instructions */}
              <div className="mt-3">
                <Textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Optional: Additional instructions (e.g., 'Add slight texture' or 'Matte finish')"
                  disabled={isProcessing}
                  className="min-h-[50px] resize-none text-xs"
                />
              </div>
            </div>
          )}

          {editMode === 'upload' && (
            <div className="mb-3">
              <SelectiveEditUploader
                selectedImages={uploadedImageUrls}
                onImagesChange={setUploadedImageUrls}
                maxImages={5}
              />
              
              {/* Instructions for how to apply the upload */}
              <div className="mt-3">
                <Textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Describe how to apply these images (e.g., 'Use as fabric texture' or 'Replace with this chair')"
                  disabled={isProcessing}
                  className="min-h-[50px] resize-none text-xs"
                />
              </div>
            </div>
          )}

          {editMode === 'erase' && (
            <div className="mb-3">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <Eraser className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Remove Selected Element</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The selected area will be erased and filled with matching background
                </p>
              </div>
              
              {/* Optional additional instructions */}
              <div className="mt-3">
                <Textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Optional: Specify what to fill with (e.g., 'empty floor' or 'plain wall')"
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
                : editMode === 'catalog'
                  ? selectedCatalogItem 
                    ? `Selected: ${selectedCatalogItem.name}`
                    : 'Select a product, then click Apply Edit'
                  : editMode === 'finish'
                    ? selectedFinish
                      ? `Selected: ${selectedFinish.name}`
                      : 'Select a finish, then click Apply Edit'
                    : editMode === 'erase'
                      ? 'Ready to erase - click Apply Edit'
                      : uploadedImageUrls.length > 0
                        ? `${uploadedImageUrls.length} image(s) ready - click Apply Edit`
                        : 'Upload image(s), then click Apply Edit'}
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
