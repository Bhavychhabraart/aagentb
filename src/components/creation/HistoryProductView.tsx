import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatalogViewMode } from '@/components/catalog/CatalogViewSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const ROOM_OPTIONS = [
  { value: 'living-room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'dining-room', label: 'Dining Room' },
  { value: 'office', label: 'Home Office' },
  { value: 'outdoor', label: 'Outdoor Patio' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'entryway', label: 'Entryway' },
];

const getRoomFromPrompt = (prompt: string): string => {
  const lower = prompt.toLowerCase();
  if (lower.includes('bedroom') || lower.includes('bed')) return 'bedroom';
  if (lower.includes('office') || lower.includes('desk')) return 'office';
  if (lower.includes('dining') || lower.includes('table')) return 'dining-room';
  if (lower.includes('outdoor') || lower.includes('patio')) return 'outdoor';
  if (lower.includes('kitchen')) return 'kitchen';
  return 'living-room';
};

const getRoomLabel = (roomValue: string): string => {
  const room = ROOM_OPTIONS.find(r => r.value === roomValue);
  return room?.label || 'Living Room';
};

export function HistoryProductView({ items, view, selectedImageUrl, onSelectItem }: HistoryProductViewProps) {
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [realspaceImages, setRealspaceImages] = useState<Map<string, string>>(new Map());
  const [roomTypes, setRoomTypes] = useState<Map<string, string>>(new Map());

  if (items.length === 0) {
    return null;
  }

  const isSelected = (item: GenerationHistoryItem) => selectedImageUrl === item.imageUrl;

  const handleGenerateRealspace = async (item: GenerationHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (generating.has(item.id)) return;

    const roomType = roomTypes.get(item.id) || getRoomFromPrompt(item.prompt);

    setGenerating(prev => new Set(prev).add(item.id));

    try {
      const { data, error } = await supabase.functions.invoke('generate-realspace-image', {
        body: {
          productImageUrl: item.imageUrl,
          productName: item.prompt.slice(0, 50),
          roomType,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setRealspaceImages(prev => new Map(prev).set(item.id, data.imageUrl));
        toast.success('Room view generated!');
      } else {
        throw new Error('No image returned');
      }
    } catch (error: unknown) {
      console.error('Error generating realspace image:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate room view';
      toast.error(message);
    } finally {
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRoomChange = (itemId: string, roomType: string) => {
    setRoomTypes(prev => new Map(prev).set(itemId, roomType));
    if (realspaceImages.has(itemId)) {
      setRealspaceImages(prev => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

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

  // Realspace View - Products with AI room context generation
  if (view === 'realspace') {
    const isGeneratingAny = generating.size > 0;
    const itemsWithoutImages = items.filter(item => !realspaceImages.has(item.id));

    const handleGenerateAll = async () => {
      if (isGeneratingAny || itemsWithoutImages.length === 0) return;

      // Add all items to generating set
      setGenerating(new Set(itemsWithoutImages.map(item => item.id)));

      for (const item of itemsWithoutImages) {
        const roomType = roomTypes.get(item.id) || getRoomFromPrompt(item.prompt);

        try {
          const { data, error } = await supabase.functions.invoke('generate-realspace-image', {
            body: {
              productImageUrl: item.imageUrl,
              productName: item.prompt.slice(0, 50),
              roomType,
            },
          });

          if (error) throw error;

          if (data?.imageUrl) {
            setRealspaceImages(prev => new Map(prev).set(item.id, data.imageUrl));
          }
        } catch (error) {
          console.error('Error generating realspace image:', error);
        }

        // Remove from generating set
        setGenerating(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }

      toast.success('All room views generated!');
    };

    return (
      <div className="space-y-3">
        {/* Generate All Button */}
        {itemsWithoutImages.length > 0 && (
          <Button
            onClick={handleGenerateAll}
            disabled={isGeneratingAny}
            className="w-full gap-2"
            variant="outline"
          >
            {isGeneratingAny ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {generating.size} of {items.length}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All Views ({itemsWithoutImages.length})
              </>
            )}
          </Button>
        )}

        {items.map((item, index) => {
          const isGenerating = generating.has(item.id);
          const generatedImage = realspaceImages.get(item.id);
          const currentRoom = roomTypes.get(item.id) || getRoomFromPrompt(item.prompt);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'rounded-xl overflow-hidden border-2 transition-all duration-200 relative group',
                'hover:shadow-lg',
                isSelected(item)
                  ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
                  : 'border-border/50 hover:border-primary/50'
              )}
            >
              {/* Image area */}
              <button
                onClick={() => onSelectItem(item)}
                className="w-full relative"
              >
                {generatedImage ? (
                  <img 
                    src={generatedImage} 
                    alt="Generated room view" 
                    className="w-full aspect-[16/10] object-cover"
                  />
                ) : (
                  <div className="relative">
                    <img 
                      src={item.imageUrl} 
                      alt="Generated" 
                      className="w-full aspect-[16/10] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  </div>
                )}
                
                {/* Room context badge */}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 gap-1 bg-background/80 backdrop-blur-sm"
                >
                  <Home className="h-3 w-3" />
                  {getRoomLabel(currentRoom)}
                </Badge>

                {/* Generate button */}
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    variant={generatedImage ? 'outline' : 'default'}
                    className="gap-1.5 bg-background/90 backdrop-blur-sm hover:bg-background text-xs h-7"
                    onClick={(e) => handleGenerateRealspace(item, e)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : generatedImage ? (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        See in Room
                      </>
                    )}
                  </Button>
                </div>

                {/* Info overlay at bottom */}
                {!generatedImage && (
                  <div className="absolute bottom-0 left-0 right-24 p-3 text-left">
                    <p className="text-xs text-white font-medium line-clamp-1">
                      Custom Design
                    </p>
                    <p className="text-[10px] text-white/70 line-clamp-1 mt-0.5">
                      {item.prompt}
                    </p>
                  </div>
                )}
              </button>

              {/* Room selector */}
              <div className="p-2 bg-muted/30 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Room:</span>
                <Select
                  value={currentRoom}
                  onValueChange={(value) => handleRoomChange(item.id, value)}
                >
                  <SelectTrigger className="h-6 text-[10px] w-auto min-w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_OPTIONS.map((room) => (
                      <SelectItem key={room.value} value={room.value} className="text-xs">
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[9px] text-muted-foreground/60 font-mono ml-auto">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          );
        })}
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
