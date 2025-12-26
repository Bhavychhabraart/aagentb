import { useState } from 'react';
import { Sparkles, Loader2, Check, X, Wand2, Sofa, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FurnitureSuggestion {
  id: string;
  type: string;
  name: string;
  style: string;
  position: { x: number; y: number };
  accepted: boolean;
}

interface AutoFurnishPanelProps {
  isOpen: boolean;
  onClose: () => void;
  renderUrl: string | null;
  onApply: (suggestions: FurnitureSuggestion[]) => void;
}

export function AutoFurnishPanel({
  isOpen,
  onClose,
  renderUrl,
  onApply,
}: AutoFurnishPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<FurnitureSuggestion[]>([]);
  const [roomStyle, setRoomStyle] = useState<string>('');

  const analyzRoom = async () => {
    if (!renderUrl) {
      toast.error('No render to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-furnish', {
        body: { roomImageUrl: renderUrl },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(
          data.suggestions.map((s: any, idx: number) => ({
            id: `suggestion_${idx}`,
            type: s.type,
            name: s.name,
            style: s.style || 'Modern',
            position: s.position || { x: 50, y: 50 },
            accepted: true,
          }))
        );
        setRoomStyle(data.detected_style || 'Contemporary');
        toast.success(`${data.suggestions.length} furniture suggestions ready`);
      }
    } catch (error) {
      console.error('Auto-furnish error:', error);
      toast.error('Failed to analyze room');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const handleApply = () => {
    const accepted = suggestions.filter(s => s.accepted);
    if (accepted.length === 0) {
      toast.error('Select at least one item');
      return;
    }
    onApply(accepted);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute left-4 top-24 z-20 w-72 animate-slide-in-right">
      <div className="glass-premium rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Auto-Furnish</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-medium mb-1">AI-Powered Furnishing</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Analyze your room and get intelligent furniture suggestions
              </p>
              <Button
                onClick={analyzRoom}
                disabled={isAnalyzing || !renderUrl}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analyze Room
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Detected style */}
              {roomStyle && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    Detected Style
                  </p>
                  <p className="text-sm font-medium text-primary">{roomStyle}</p>
                </div>
              )}

              {/* Suggestions list */}
              <ScrollArea className="h-48 mb-3">
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => toggleSuggestion(suggestion.id)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg transition-all',
                        suggestion.accepted
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded flex items-center justify-center shrink-0',
                          suggestion.accepted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {suggestion.accepted ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Sofa className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-medium truncate">{suggestion.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {suggestion.type} • {suggestion.style}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSuggestions([])}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleApply}
                  disabled={!suggestions.some(s => s.accepted)}
                >
                  Apply {suggestions.filter(s => s.accepted).length} Items
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
