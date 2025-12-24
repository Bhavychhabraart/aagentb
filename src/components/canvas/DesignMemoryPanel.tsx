import { useState, useEffect } from 'react';
import { Brain, Trash2, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  DesignPreference,
  PreferenceCategory,
  getUserPreferences,
  clearMemory,
  deletePreference,
} from '@/services/designMemoryService';

interface DesignMemoryPanelProps {
  userId: string;
  memoryEnabled: boolean;
  onMemoryToggle: (enabled: boolean) => void;
  isLearning?: boolean;
}

interface CategoryData {
  category: PreferenceCategory;
  label: string;
  icon: string;
  preferences: DesignPreference[];
}

const CATEGORY_CONFIG: Record<PreferenceCategory, { label: string; icon: string }> = {
  style: { label: 'Styles', icon: '🎨' },
  color: { label: 'Colors', icon: '🌈' },
  furniture: { label: 'Furniture', icon: '🛋️' },
  function: { label: 'Functions', icon: '✨' },
  lighting: { label: 'Lighting', icon: '💡' },
  budget: { label: 'Budget', icon: '💰' },
};

export function DesignMemoryPanel({
  userId,
  memoryEnabled,
  onMemoryToggle,
  isLearning = false,
}: DesignMemoryPanelProps) {
  const [preferences, setPreferences] = useState<DesignPreference[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['style', 'color']));
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  const loadPreferences = async () => {
    const prefs = await getUserPreferences(userId);
    setPreferences(prefs);
  };

  const handleClearMemory = async () => {
    if (!confirm('Clear all learned preferences? This cannot be undone.')) return;
    
    setIsClearing(true);
    await clearMemory(userId);
    setPreferences([]);
    setIsClearing(false);
  };

  const handleDeletePreference = async (prefId: string) => {
    await deletePreference(userId, prefId);
    setPreferences(prev => prev.filter(p => p.id !== prefId));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Group preferences by category
  const categoryData: CategoryData[] = (Object.keys(CATEGORY_CONFIG) as PreferenceCategory[]).map(category => ({
    category,
    ...CATEGORY_CONFIG[category],
    preferences: preferences
      .filter(p => p.category === category)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10),
  }));

  const totalPreferences = preferences.length;
  const maxWeight = Math.max(...preferences.map(p => p.weight), 1);

  return (
    <div className="glass-premium rounded-xl border border-border/30 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-background/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
              memoryEnabled 
                ? "bg-primary/20 shadow-glow" 
                : "bg-muted/30"
            )}>
              <Brain className={cn(
                "h-4 w-4 transition-colors",
                memoryEnabled ? "text-primary" : "text-muted-foreground",
                isLearning && "animate-pulse"
              )} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Design Memory</h3>
              <p className="text-xs text-muted-foreground">
                {totalPreferences} learned preference{totalPreferences !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Switch
            checked={memoryEnabled}
            onCheckedChange={onMemoryToggle}
          />
        </div>
        
        {isLearning && (
          <div className="mt-2 flex items-center gap-2 text-xs text-primary animate-pulse">
            <Sparkles className="h-3 w-3" />
            Learning from your choices...
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="max-h-[400px]">
        <div className="p-3 space-y-2">
          {categoryData.filter(c => c.preferences.length > 0).map(({ category, label, icon, preferences: catPrefs }) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger asChild>
                <button className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg",
                  "hover:bg-muted/30 transition-colors text-left"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {catPrefs.length}
                    </span>
                  </div>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="pl-6 pr-2 pb-2 space-y-1.5">
                  {catPrefs.map(pref => {
                    const normalizedWeight = (pref.weight / maxWeight) * 100;
                    
                    return (
                      <div
                        key={pref.id}
                        className="group flex items-center gap-2 py-1"
                      >
                        {/* Color swatch for color preferences */}
                        {category === 'color' && pref.preference_key.startsWith('#') ? (
                          <div
                            className="h-4 w-4 rounded-full border border-border/30 shrink-0"
                            style={{ backgroundColor: pref.preference_key }}
                          />
                        ) : null}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-foreground truncate">
                              {pref.preference_key}
                            </span>
                            <button
                              onClick={() => handleDeletePreference(pref.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                          {/* Weight bar */}
                          <div className="h-1 bg-muted/30 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-primary/50 rounded-full transition-all duration-300"
                              style={{ width: `${normalizedWeight}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {totalPreferences === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No preferences learned yet</p>
              <p className="text-xs mt-1">Your design choices will be remembered here</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {totalPreferences > 0 && (
        <div className="px-4 py-3 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearMemory}
            disabled={isClearing}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {isClearing ? 'Clearing...' : 'Clear Memory'}
          </Button>
        </div>
      )}
    </div>
  );
}
