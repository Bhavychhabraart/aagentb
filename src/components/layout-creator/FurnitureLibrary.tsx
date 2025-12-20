import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FURNITURE_LIBRARY, FURNITURE_CATEGORIES, FurnitureBlockDefinition } from '@/types/layout-creator';
import { cn } from '@/lib/utils';

interface FurnitureLibraryProps {
  onFurnitureSelect: (furniture: FurnitureBlockDefinition) => void;
}

export function FurnitureLibrary({ onFurnitureSelect }: FurnitureLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(FURNITURE_CATEGORIES);

  const filteredFurniture = FURNITURE_LIBRARY.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const groupedFurniture = FURNITURE_CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredFurniture.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, FurnitureBlockDefinition[]>);

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="font-semibold text-sm mb-2">Furniture Library</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search furniture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {FURNITURE_CATEGORIES.map(category => {
            const items = groupedFurniture[category];
            if (items.length === 0 && searchQuery) return null;

            return (
              <Collapsible
                key={category}
                open={expandedCategories.includes(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded-md transition-colors">
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {items.length}
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onFurnitureSelect(item)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-md border border-border',
                          'hover:border-primary hover:bg-accent transition-colors',
                          'text-xs'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-8 flex items-center justify-center',
                            item.shape === 'circle' ? 'rounded-full' : 'rounded-sm'
                          )}
                          style={{ 
                            backgroundColor: item.color,
                            aspectRatio: item.width / item.depth
                          }}
                        />
                        <span className="text-center line-clamp-1">{item.name}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {item.width}" × {item.depth}"
                        </span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Click or drag to add furniture
        </p>
      </div>
    </div>
  );
}
