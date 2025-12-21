import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MATERIAL_CATEGORIES,
  MaterialCategory,
  MaterialItem,
  searchMaterials,
  getMaterialCount,
  getSubcategoriesForCategory,
} from '@/services/materialsLibrary';

interface MaterialsPickerProps {
  selectedMaterials: string[];
  onSelectionChange: (materials: string[]) => void;
  maxHeight?: string;
}

export function MaterialsPicker({
  selectedMaterials,
  onSelectionChange,
  maxHeight = '400px',
}: MaterialsPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('All');
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Get filtered materials based on search and category
  const filteredMaterials = useMemo(() => {
    return searchMaterials(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  // Group materials by subcategory
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, MaterialItem[]> = {};
    filteredMaterials.forEach(material => {
      if (!groups[material.subcategory]) {
        groups[material.subcategory] = [];
      }
      groups[material.subcategory].push(material);
    });
    return groups;
  }, [filteredMaterials]);

  const subcategories = Object.keys(groupedMaterials).sort();

  const toggleMaterial = (materialId: string) => {
    if (selectedMaterials.includes(materialId)) {
      onSelectionChange(selectedMaterials.filter(id => id !== materialId));
    } else {
      onSelectionChange([...selectedMaterials, materialId]);
    }
  };

  const toggleSubcategory = (subcategory: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategory)) {
        newSet.delete(subcategory);
      } else {
        newSet.add(subcategory);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const getMaterialById = (id: string): MaterialItem | undefined => {
    return filteredMaterials.find(m => m.id === id) || 
           searchMaterials('', 'All').find(m => m.id === id);
  };

  // Expand all subcategories by default for better UX
  const isSubcategoryExpanded = (subcategory: string) => {
    if (expandedSubcategories.size === 0) return true; // Default expanded
    return expandedSubcategories.has(subcategory);
  };

  return (
    <div className="space-y-3">
      {/* Selected Materials Chips */}
      {selectedMaterials.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMaterials.map(id => {
            const material = getMaterialById(id);
            return material ? (
              <Badge
                key={id}
                variant="default"
                className="gap-1 pr-1 cursor-pointer"
                onClick={() => toggleMaterial(id)}
              >
                {material.colorHex && (
                  <span
                    className="w-3 h-3 rounded-full border border-white/30"
                    style={{ backgroundColor: material.colorHex }}
                  />
                )}
                {material.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ) : null;
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-6 text-xs text-muted-foreground hover:text-destructive"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search materials..."
          className="pl-9 bg-muted/50"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as MaterialCategory)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {MATERIAL_CATEGORIES.map(cat => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="text-xs px-2.5 py-1 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-border data-[state=active]:border-primary"
            >
              {cat} ({getMaterialCount(cat)})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Materials Grid */}
      <ScrollArea className={cn("rounded-lg border border-border")} style={{ height: maxHeight }}>
        <div className="p-3 space-y-4">
          {subcategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No materials found matching "{searchQuery}"
            </p>
          ) : (
            subcategories.map(subcategory => (
              <div key={subcategory} className="space-y-2">
                {/* Subcategory Header */}
                <button
                  onClick={() => toggleSubcategory(subcategory)}
                  className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-md p-1 -m-1"
                >
                  {isSubcategoryExpanded(subcategory) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {subcategory}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({groupedMaterials[subcategory].length})
                  </span>
                </button>

                {/* Materials Grid */}
                {isSubcategoryExpanded(subcategory) && (
                  <div className="grid grid-cols-2 gap-1.5 pl-6">
                    {groupedMaterials[subcategory].map(material => {
                      const isSelected = selectedMaterials.includes(material.id);
                      return (
                        <button
                          key={material.id}
                          onClick={() => toggleMaterial(material.id)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md text-left transition-all text-sm",
                            "border hover:border-primary/50",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-muted/50"
                          )}
                        >
                          {/* Color/Material Swatch */}
                          <div
                            className={cn(
                              "w-6 h-6 rounded flex-shrink-0 border",
                              isSelected ? "border-primary" : "border-border"
                            )}
                            style={{
                              backgroundColor: material.colorHex || '#E5E5E5',
                            }}
                          />
                          
                          {/* Material Info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-xs font-medium truncate",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {material.name}
                            </p>
                          </div>

                          {/* Selected Indicator */}
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Properties Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Water Resistant</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Scratch Resistant</span>
        </div>
      </div>
    </div>
  );
}
