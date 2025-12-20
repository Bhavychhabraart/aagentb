import { useState } from 'react';
import { Send, X, Loader2, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectionRegion } from './SelectionOverlay';
import { cn } from '@/lib/utils';

interface SelectiveEditPanelProps {
  selection: SelectionRegion;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function SelectiveEditPanel({ 
  selection, 
  onSubmit, 
  onCancel, 
  isProcessing 
}: SelectiveEditPanelProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt.trim());
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

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change in this area... (e.g., 'Replace the sofa with a modern white sectional')"
            disabled={isProcessing}
            className="min-h-[80px] resize-none mb-3"
            autoFocus
          />
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press Enter to apply, Esc to cancel
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
                disabled={!prompt.trim() || isProcessing}
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
