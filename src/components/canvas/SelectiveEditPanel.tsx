import { useState, useEffect } from 'react';
import { Send, X, Loader2, Crop, Type, Paintbrush, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectionRegion } from './SelectionOverlay';
import { SelectiveEditFinishes } from './SelectiveEditFinishes';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { FinishItem } from '@/services/finishesLibrary';
import { cn } from '@/lib/utils';
import { generateSelectionPreview } from '@/utils/generateSelectionMask';

interface SelectiveEditPanelProps {
  selection: SelectionRegion;
  renderUrl: string;
  onSubmit: (prompt: string, catalogItem?: CatalogFurnitureItem, referenceImageUrl?: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

type EditMode = 'prompt' | 'finish';

export function SelectiveEditPanel({ 
  selection, 
  renderUrl,
  onSubmit, 
  onCancel, 
  isProcessing 
}: SelectiveEditPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('prompt');
  const [selectedFinish, setSelectedFinish] = useState<FinishItem | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
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
    } else if (editMode === 'finish') {
      if (selectedFinish) {
        const finalPrompt = additionalInstructions.trim()
          ? `Apply ${selectedFinish.name} (${selectedFinish.category}) finish. ${additionalInstructions.trim()}`
          : `Apply ${selectedFinish.name} (${selectedFinish.category}) finish to this area`;
        onSubmit(finalPrompt);
      }
    }
  };

  // Only allow Enter key to submit in prompt mode (text input)
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
    : selectedFinish !== null;

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
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode('prompt')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
                editMode === 'prompt'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Type className="h-4 w-4" />
              Prompt
            </button>
            <button
              onClick={() => setEditMode('finish')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
                editMode === 'finish'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Paintbrush className="h-4 w-4" />
              Finish
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
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {editMode === 'prompt' 
                ? 'Press Enter to apply, Esc to cancel'
                : selectedFinish
                  ? `Selected: ${selectedFinish.name}`
                  : 'Select a finish, then click Apply Edit'}
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
