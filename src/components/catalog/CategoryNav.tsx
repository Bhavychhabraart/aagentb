import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryConfig } from '@/config/catalogCategories';

interface CategoryNavProps {
  categories: CategoryConfig[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onSubcategorySelect: (categoryId: string, subcategoryId: string) => void;
  itemCounts?: Record<string, number>;
  totalCount?: number;
  compact?: boolean;
}

export function CategoryNav({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  onSubcategorySelect,
  itemCounts = {},
  totalCount = 0,
  compact = false,
}: CategoryNavProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Main category bar */}
      <nav className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-hide",
        compact ? "gap-0.5" : "gap-1"
      )}>
        {/* All button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "whitespace-nowrap px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors relative",
            compact && "px-2 py-1.5 text-[10px]",
            selectedCategory === null
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
          {totalCount > 0 && (
            <span className="ml-1 text-[10px] text-muted-foreground">({totalCount})</span>
          )}
          {selectedCategory === null && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        {/* Category buttons */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const isHovered = hoveredCategory === category.id;
          const hasSubcategories = category.subcategories.length > 0;
          const count = itemCounts[category.id] || 0;

          return (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors relative",
                  compact && "px-2 py-1.5 text-[10px]",
                  isSelected || isHovered
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {category.label}
                {count > 0 && !compact && (
                  <span className="text-[10px] text-muted-foreground">({count})</span>
                )}
                {hasSubcategories && (
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    isHovered && "rotate-180"
                  )} />
                )}
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>

              {/* Subcategory dropdown */}
              {hasSubcategories && isHovered && (
                <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] py-2 bg-popover border border-border rounded-lg shadow-lg">
                  {category.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSubcategorySelect(category.id, sub.id);
                        setHoveredCategory(null);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm transition-colors",
                        selectedSubcategory === sub.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Active subcategory indicator */}
      {selectedSubcategory && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          <button
            onClick={() => onCategorySelect(selectedCategory)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
          >
            {categories.find(c => c.id === selectedCategory)?.subcategories.find(s => s.id === selectedSubcategory)?.label}
            <span className="text-primary/60">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
