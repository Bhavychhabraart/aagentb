import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpandedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: string, hasSubcategories: boolean, e: React.MouseEvent) => {
    if (hasSubcategories) {
      e.stopPropagation();
      if (expandedCategory === categoryId) {
        setExpandedCategory(null);
      } else {
        const button = buttonRefs.current.get(categoryId);
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({ 
            top: rect.bottom + 4, 
            left: Math.max(8, rect.left) // Ensure it doesn't go off screen
          });
        }
        setExpandedCategory(categoryId);
      }
    } else {
      onCategorySelect(categoryId);
      setExpandedCategory(null);
    }
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onSubcategorySelect(categoryId, subcategoryId);
    setExpandedCategory(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Main category bar */}
      <nav className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-hide",
        compact ? "gap-0.5" : "gap-1"
      )}>
        {/* All button */}
        <button
          onClick={() => {
            onCategorySelect(null);
            setExpandedCategory(null);
          }}
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
          const isExpanded = expandedCategory === category.id;
          const hasSubcategories = category.subcategories.length > 0;
          const count = itemCounts[category.id] || 0;

          return (
            <div key={category.id} className="relative">
              <button
                ref={(el) => {
                  if (el) buttonRefs.current.set(category.id, el);
                }}
                onClick={(e) => handleCategoryClick(category.id, hasSubcategories, e)}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors relative",
                  compact && "px-2 py-1.5 text-[10px]",
                  isSelected || isExpanded
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
                    isExpanded && "rotate-180"
                  )} />
                )}
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Portal-rendered subcategory dropdown */}
      {expandedCategory && createPortal(
        <div 
          className="fixed z-[100] min-w-[180px] py-2 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          {categories.find(c => c.id === expandedCategory)?.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSubcategoryClick(expandedCategory, sub.id)}
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
        </div>,
        document.body
      )}

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
