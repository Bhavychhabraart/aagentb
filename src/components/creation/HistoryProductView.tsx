import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatalogViewMode } from '@/components/catalog/CatalogViewSwitcher';

export interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

interface HistoryProductViewProps {
  items: GenerationHistoryItem[];
  view: CatalogViewMode;
  selectedImageUrl: string | null;
  onSelectItem: (item: GenerationHistoryItem) => void;
}

export function HistoryProductView({ items, view, selectedImageUrl, onSelectItem }: HistoryProductViewProps) {
  if (items.length === 0) {
    return null;
  }

  const isSelected = (item: GenerationHistoryItem) => selectedImageUrl === item.imageUrl;

  // Grid View - 2 column compact grid
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectItem(item)}
            className={cn(
              'rounded-xl overflow-hidden border-2 transition-all duration-200',
              'hover:shadow-lg hover:scale-[1.02]',
              isSelected(item)
                ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
                : 'border-border/50 hover:border-primary/50'
            )}
          >
            <img 
              src={item.imageUrl} 
              alt="Generated" 
              className="w-full aspect-square object-cover"
            />
            <div className="p-2 bg-muted/30 text-left">
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                {item.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  // Magazine View - First item hero, rest in grid
  if (view === 'magazine') {
    const [hero, ...rest] = items;
    return (
      <div className="space-y-2">
        {/* Hero item */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelectItem(hero)}
          className={cn(
            'w-full rounded-xl overflow-hidden border-2 transition-all duration-200',
            'hover:shadow-lg',
            isSelected(hero)
              ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
              : 'border-border/50 hover:border-primary/50'
          )}
        >
          <img 
            src={hero.imageUrl} 
            alt="Latest generation" 
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="p-3 bg-muted/30 text-left">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {hero.prompt}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
              {hero.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </motion.button>

        {/* Rest in 3-column grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {rest.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index + 1) * 0.05 }}
                onClick={() => onSelectItem(item)}
                className={cn(
                  'rounded-lg overflow-hidden border-2 transition-all duration-200',
                  'hover:shadow-md hover:scale-[1.02]',
                  isSelected(item)
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-border/50 hover:border-primary/50'
                )}
              >
                <img 
                  src={item.imageUrl} 
                  alt="Generated" 
                  className="w-full aspect-square object-cover"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // List View - Full width rows with prompt preview
  if (view === 'list') {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectItem(item)}
            className={cn(
              'w-full flex gap-3 p-2 rounded-xl border-2 transition-all duration-200 text-left',
              'hover:shadow-md hover:bg-muted/30',
              isSelected(item)
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'border-border/50 hover:border-primary/50'
            )}
          >
            <img 
              src={item.imageUrl} 
              alt="Generated" 
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                {item.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  // Masonry View - Variable height based on prompt length
  if (view === 'masonry') {
    return (
      <div className="columns-2 gap-2 space-y-2">
        {items.map((item, index) => {
          const hasLongPrompt = item.prompt.length > 60;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectItem(item)}
              className={cn(
                'w-full rounded-xl overflow-hidden border-2 transition-all duration-200 break-inside-avoid mb-2',
                'hover:shadow-lg hover:scale-[1.01]',
                isSelected(item)
                  ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
                  : 'border-border/50 hover:border-primary/50'
              )}
            >
              <img 
                src={item.imageUrl} 
                alt="Generated" 
                className={cn(
                  'w-full object-cover',
                  hasLongPrompt ? 'aspect-[3/4]' : 'aspect-square'
                )}
              />
              <div className="p-2 bg-muted/30 text-left">
                <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.prompt}
                </p>
                <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                  {item.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Realspace View - Products with room context overlay
  if (view === 'realspace') {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectItem(item)}
            className={cn(
              'w-full rounded-xl overflow-hidden border-2 transition-all duration-200 relative group',
              'hover:shadow-lg',
              isSelected(item)
                ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
                : 'border-border/50 hover:border-primary/50'
            )}
          >
            {/* Background room effect */}
            <div className="relative">
              <img 
                src={item.imageUrl} 
                alt="Generated" 
                className="w-full aspect-[16/10] object-cover"
              />
              {/* Gradient overlay to simulate room context */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              
              {/* Room context badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                <Home className="h-3 w-3 text-white/80" />
                <span className="text-[10px] text-white/80 font-medium">In Context</span>
              </div>

              {/* Info overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <p className="text-xs text-white font-medium line-clamp-1">
                  Custom Design
                </p>
                <p className="text-[10px] text-white/70 line-clamp-1 mt-0.5">
                  {item.prompt}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  // Fallback to grid
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectItem(item)}
          className="rounded-xl overflow-hidden border border-border"
        >
          <img src={item.imageUrl} alt="Generated" className="w-full aspect-square object-cover" />
        </button>
      ))}
    </div>
  );
}
