import { useState } from 'react';
import { Wand2, Sun, Palette, Layers, Lightbulb, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AIDirectorPanelProps {
  onApplyChange: (prompt: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const QUICK_ACTIONS = [
  { id: 'walls', icon: Palette, label: 'Change Wall Colors', promptTemplate: 'Change all wall colors to' },
  { id: 'floor', icon: Layers, label: 'Change Flooring', promptTemplate: 'Change the floor to' },
  { id: 'lighting', icon: Sun, label: 'Adjust Lighting', promptTemplate: 'Adjust the lighting to' },
  { id: 'ambiance', icon: Lightbulb, label: 'Change Ambiance', promptTemplate: 'Change the room ambiance to' },
];

const STYLE_PRESETS = [
  { id: 'warm', label: 'Warm & Cozy', prompt: 'Make the room feel warm and cozy with soft warm lighting and earthy tones' },
  { id: 'modern', label: 'Modern & Clean', prompt: 'Make the room feel modern and clean with bright white lighting and minimal colors' },
  { id: 'dramatic', label: 'Dramatic', prompt: 'Add dramatic moody lighting with high contrast and deep shadows' },
  { id: 'natural', label: 'Natural Light', prompt: 'Maximize natural daylight, make everything bright and airy with sun rays' },
  { id: 'evening', label: 'Evening Mood', prompt: 'Create an evening atmosphere with warm ambient lighting and sunset tones' },
  { id: 'scandinavian', label: 'Scandinavian', prompt: 'Apply Scandinavian design style with white walls, light wood, and minimal decor' },
];

const COLOR_PRESETS = [
  { id: 'white', label: 'White', hex: '#FFFFFF' },
  { id: 'cream', label: 'Cream', hex: '#FFFDD0' },
  { id: 'gray', label: 'Gray', hex: '#808080' },
  { id: 'sage', label: 'Sage', hex: '#9DC183' },
  { id: 'navy', label: 'Navy', hex: '#000080' },
  { id: 'terracotta', label: 'Terracotta', hex: '#E2725B' },
  { id: 'charcoal', label: 'Charcoal', hex: '#36454F' },
  { id: 'blush', label: 'Blush', hex: '#DE5D83' },
];

export function AIDirectorPanel({ onApplyChange, onClose, isProcessing }: AIDirectorPanelProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState('');

  const handleQuickActionClick = (actionId: string) => {
    setActiveAction(activeAction === actionId ? null : actionId);
    setCustomValue('');
  };

  const handleColorClick = (colorLabel: string) => {
    const action = QUICK_ACTIONS.find(a => a.id === activeAction);
    if (action) {
      onApplyChange(`${action.promptTemplate} ${colorLabel}`);
    }
  };

  const handleCustomSubmit = () => {
    const action = QUICK_ACTIONS.find(a => a.id === activeAction);
    if (action && customValue.trim()) {
      onApplyChange(`${action.promptTemplate} ${customValue.trim()}`);
      setCustomValue('');
    }
  };

  const handlePresetClick = (prompt: string) => {
    onApplyChange(prompt);
  };

  return (
    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
      <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">AI Director</h3>
              <p className="text-xs text-muted-foreground">Quick global changes</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickActionClick(action.id)}
                  disabled={isProcessing}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors",
                    activeAction === action.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/50 border-border hover:bg-muted"
                  )}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-[10px] text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color/Value Selector when action is active */}
          {activeAction && (
            <div className="space-y-3 animate-slide-up">
              <p className="text-xs font-medium text-muted-foreground">
                Select {activeAction === 'walls' ? 'color' : 'style'}
              </p>
              
              {activeAction === 'walls' && (
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => handleColorClick(color.label)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      <div 
                        className="h-4 w-4 rounded-full border border-border/50"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs">{color.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder={`Enter custom ${activeAction === 'walls' ? 'color' : 'value'}...`}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  disabled={isProcessing}
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                />
                <Button 
                  size="sm" 
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim() || isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            </div>
          )}

          {/* Style Presets */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Style Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.prompt)}
                  disabled={isProcessing}
                  className="px-3 py-2 text-xs rounded-lg bg-muted/50 border border-border hover:bg-muted hover:border-primary/50 transition-colors text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying changes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
