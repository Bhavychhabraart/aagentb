import { useState, useMemo } from 'react';
import { Sparkles, Loader2, Check, X, Wand2, ChevronRight, RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CatalogFurnitureItem } from '@/services/catalogService';

interface FurnitureSuggestion {
  catalogItem: CatalogFurnitureItem;
  reason: string;
  position: { x: number; y: number };
  accepted: boolean;
}

interface AutoFurnishPanelProps {
  isOpen: boolean;
  onClose: () => void;
  renderUrl: string | null;
  catalogItems: CatalogFurnitureItem[];
  onApply: (selectedItems: CatalogFurnitureItem[]) => void;
}

export function AutoFurnishPanel({
  isOpen,
  onClose,
  renderUrl,
  catalogItems,
  onApply,
}: AutoFurnishPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<FurnitureSuggestion[]>([]);
  const [roomStyle, setRoomStyle] = useState<string>('');
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);

  const analyzeRoom = async () => {
    if (!renderUrl) {
      toast.error('No render to analyze');
      return;
    }

    if (catalogItems.length === 0) {
      toast.error('No catalog items available');
      return;
    }

    setIsAnalyzing(true);
    setSuggestions([]);
    
    try {
      // Send catalog items to the edge function
      const catalogPayload = catalogItems.slice(0, 50).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        imageUrl: item.imageUrl,
      }));

      const { data, error } = await supabase.functions.invoke('auto-furnish', {
        body: { 
          roomImageUrl: renderUrl,
          catalogItems: catalogPayload,
        },
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        // Map catalog IDs back to full catalog items
        const mappedSuggestions: FurnitureSuggestion[] = [];
        
        for (const suggestion of data.suggestions) {
          const catalogItem = catalogItems.find(item => item.id === suggestion.catalog_id);
          if (catalogItem) {
            mappedSuggestions.push({
              catalogItem,
              reason: suggestion.reason || 'Fits the room style',
              position: suggestion.position || { x: 50, y: 50 },
              accepted: true,
            });
          }
        }

        setSuggestions(mappedSuggestions);
        setRoomStyle(data.detected_style || 'Contemporary');
        toast.success(`${mappedSuggestions.length} products selected from catalog`);
      } else {
        toast.info('No matching products found. Try with a different room.');
      }
    } catch (error) {
      console.error('Auto-furnish error:', error);
      toast.error('Failed to analyze room');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const handleSwap = (index: number, newItem: CatalogFurnitureItem) => {
    setSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, catalogItem: newItem } : s))
    );
    setSwappingIndex(null);
    toast.success(`Swapped to ${newItem.name}`);
  };

  const handleApply = () => {
    const accepted = suggestions.filter(s => s.accepted);
    if (accepted.length === 0) {
      toast.error('Select at least one item');
      return;
    }
    onApply(accepted.map(s => s.catalogItem));
  };

  // Get alternatives for swapping (same category)
  const getAlternatives = (currentItem: CatalogFurnitureItem) => {
    return catalogItems
      .filter(item => 
        item.category === currentItem.category && 
        item.id !== currentItem.id
      )
      .slice(0, 6);
  };

  const totalPrice = useMemo(() => {
    return suggestions
      .filter(s => s.accepted)
      .reduce((sum, s) => sum + (s.catalogItem.price || 0), 0);
  }, [suggestions]);

  if (!isOpen) return null;

  return (
    <div className="absolute left-4 top-24 z-20 w-80 animate-slide-in-right">
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
                AI will select real products from your catalog that match this room
              </p>
              <Button
                onClick={analyzeRoom}
                disabled={isAnalyzing || !renderUrl}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Room...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Find Matching Products
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
              <ScrollArea className="h-64 mb-3">
                <div className="space-y-2">
                  {suggestions.map((suggestion, idx) => (
                    <div key={`${suggestion.catalogItem.id}-${idx}`} className="space-y-1">
                      <button
                        onClick={() => toggleSuggestion(idx)}
                        className={cn(
                          'w-full flex items-start gap-2 p-2 rounded-lg transition-all text-left',
                          suggestion.accepted
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5',
                            suggestion.accepted
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {suggestion.accepted && <Check className="h-3 w-3" />}
                        </div>
                        
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0">
                          {suggestion.catalogItem.imageUrl ? (
                            <img 
                              src={suggestion.catalogItem.imageUrl} 
                              alt={suggestion.catalogItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Sparkles className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{suggestion.catalogItem.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {suggestion.catalogItem.category}
                          </p>
                          {suggestion.catalogItem.price ? (
                            <p className="text-xs font-semibold text-primary">
                              ${suggestion.catalogItem.price.toLocaleString()}
                            </p>
                          ) : null}
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {suggestion.reason}
                          </p>
                        </div>
                        
                        {/* Swap button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSwappingIndex(swappingIndex === idx ? null : idx);
                          }}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </button>
                      
                      {/* Swap alternatives */}
                      {swappingIndex === idx && (
                        <div className="ml-7 p-2 rounded-lg bg-muted/50 border border-border/30">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                            Swap with alternative
                          </p>
                          <div className="grid grid-cols-3 gap-1">
                            {getAlternatives(suggestion.catalogItem).map(alt => (
                              <button
                                key={alt.id}
                                onClick={() => handleSwap(idx, alt)}
                                className="group relative aspect-square rounded-md overflow-hidden border border-border/30 hover:border-primary/50 transition-all"
                              >
                                {alt.imageUrl ? (
                                  <img 
                                    src={alt.imageUrl} 
                                    alt={alt.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                          {getAlternatives(suggestion.catalogItem).length === 0 && (
                            <p className="text-[10px] text-muted-foreground text-center py-2">
                              No alternatives in this category
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Total price */}
              {totalPrice > 0 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-muted/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estimated Total</span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {totalPrice.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSuggestions([]);
                    setSwappingIndex(null);
                  }}
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
