import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { AIZoneSelection } from '@/types/layout-creator';

interface AIZonePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: AIZoneSelection | null;
  onGenerate: (prompt: string, useBrainKnowledge: boolean) => void;
  isGenerating: boolean;
  unit: string;
}

const QUICK_PROMPTS = [
  'Cozy seating area with sofa and coffee table',
  'Work desk setup with chair',
  'Reading corner with armchair and lamp',
  'Dining area with table and chairs',
  'Entertainment zone with TV stand',
  'Bedroom setup with bed and nightstands',
];

export function AIZonePromptModal({
  open,
  onOpenChange,
  zone,
  onGenerate,
  isGenerating,
  unit,
}: AIZonePromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const [useBrainKnowledge, setUseBrainKnowledge] = useState(true);

  const pixelsPerInch = 4;
  const zoneWidthInches = zone ? zone.width / pixelsPerInch : 0;
  const zoneHeightInches = zone ? zone.height / pixelsPerInch : 0;

  const formatDimension = (inches: number) => {
    if (unit === 'ft') return `${(inches / 12).toFixed(1)} ft`;
    if (unit === 'm') return `${(inches * 0.0254).toFixed(2)} m`;
    if (unit === 'cm') return `${(inches * 2.54).toFixed(0)} cm`;
    return `${inches.toFixed(0)}"`;
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt.trim(), useBrainKnowledge);
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Zone Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Zone Info */}
          {zone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Selected area:</span>
              <Badge variant="secondary">
                {formatDimension(zoneWidthInches)} × {formatDimension(zoneHeightInches)}
              </Badge>
            </div>
          )}

          {/* Quick Prompts */}
          <div className="space-y-2">
            <Label className="text-sm">Quick suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <Badge
                  key={qp}
                  variant={prompt === qp ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleQuickPrompt(qp)}
                >
                  {qp}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe what to place in this zone</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., A cozy reading corner with an armchair, side table, and floor lamp..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Brain Knowledge Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="brain-knowledge" className="text-sm font-medium">
                Use Brain Knowledge
              </Label>
              <p className="text-xs text-muted-foreground">
                Apply your saved rules and style preferences
              </p>
            </div>
            <Switch
              id="brain-knowledge"
              checked={useBrainKnowledge}
              onCheckedChange={setUseBrainKnowledge}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
