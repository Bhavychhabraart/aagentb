import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { CategoryNode } from '@/types/catalog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryTreeProps {
  categories: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string, categorySlug: string) => void;
  expandedCategories: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  level?: number;
}

export function CategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  expandedCategories,
  onToggleExpand,
  level = 0,
}: CategoryTreeProps) {
  return (
    <div className={cn("space-y-0.5", level > 0 && "ml-3 border-l border-border/50 pl-2")}>
      {categories.map((category) => (
        <CategoryTreeItem
          key={category.id}
          category={category}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          expandedCategories={expandedCategories}
          onToggleExpand={onToggleExpand}
          level={level}
        />
      ))}
    </div>
  );
}

interface CategoryTreeItemProps {
  category: CategoryNode;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string, categorySlug: string) => void;
  expandedCategories: Set<string>;
  onToggleExpand: (categoryId: string) => void;
  level: number;
}

function CategoryTreeItem({
  category,
  selectedCategory,
  onSelectCategory,
  expandedCategories,
  onToggleExpand,
  level,
}: CategoryTreeItemProps) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategory === category.id;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(category.id);
    }
    onSelectCategory(category.id, category.slug);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(category.id);
  };

  return (
    <div>
      <motion.button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-200",
          "hover:bg-accent/50",
          isSelected && "bg-primary/10 text-primary font-medium",
          !isSelected && "text-muted-foreground hover:text-foreground",
          level === 0 && "font-medium"
        )}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {hasChildren ? (
          <button
            onClick={handleExpandClick}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        
        {level === 0 && (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary/70" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )
        )}
        
        <span className="flex-1 text-left truncate">{category.name}</span>
        
        {level > 0 && !hasChildren && (
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            •
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CategoryTree
              categories={category.children!}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              expandedCategories={expandedCategories}
              onToggleExpand={onToggleExpand}
              level={level + 1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
