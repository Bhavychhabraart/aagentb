import { useState, useEffect } from 'react';
import { Search, Check, Upload, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  FinishItem, 
  FINISH_CATEGORIES, 
  FinishCategory,
  searchFinishes,
  fetchCustomFinishes
} from '@/services/finishesLibrary';
import { CustomFinishUploader } from './CustomFinishUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SelectiveEditFinishesProps {
  selectedFinish: FinishItem | null;
  onFinishSelect: (finish: FinishItem | null) => void;
}

export function SelectiveEditFinishes({ 
  selectedFinish, 
  onFinishSelect 
}: SelectiveEditFinishesProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FinishCategory>('All');
  const [customFinishes, setCustomFinishes] = useState<FinishItem[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadCustomFinishes();
  }, []);

  const loadCustomFinishes = async () => {
    const finishes = await fetchCustomFinishes();
    setCustomFinishes(finishes);
  };

  const filteredFinishes = searchFinishes(searchQuery, activeCategory, customFinishes);

  const handleFinishClick = (finish: FinishItem) => {
    if (selectedFinish?.id === finish.id) {
      onFinishSelect(null);
    } else {
      onFinishSelect(finish);
    }
  };

  const handleDeleteCustomFinish = async (e: React.MouseEvent, finish: FinishItem) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('custom_finishes')
      .delete()
      .eq('id', finish.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to delete' });
      return;
    }

    setCustomFinishes(prev => prev.filter(f => f.id !== finish.id));
    if (selectedFinish?.id === finish.id) {
      onFinishSelect(null);
    }
    toast({ title: 'Finish deleted' });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search finishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 flex-wrap">
        {FINISH_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              cat === 'My Finishes' && customFinishes.length > 0 && "ring-1 ring-primary/30"
            )}
          >
            {cat}
            {cat === 'My Finishes' && customFinishes.length > 0 && (
              <span className="ml-1 text-[10px]">({customFinishes.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Finishes Grid */}
      <ScrollArea className="h-[140px]">
        {filteredFinishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-xs text-muted-foreground">
            {activeCategory === 'My Finishes' ? (
              <>
                <p className="mb-2">No custom finishes yet</p>
                <Button size="sm" variant="outline" onClick={() => setShowUploader(true)}>
                  <Upload className="h-3 w-3 mr-1" />
                  Upload First Finish
                </Button>
              </>
            ) : (
              <p>No finishes found</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2 pr-3">
            {filteredFinishes.slice(0, 25).map(finish => (
              <button
                key={finish.id}
                onClick={() => handleFinishClick(finish)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                  "hover:ring-2 hover:ring-primary/50",
                  selectedFinish?.id === finish.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/50"
                )}
                title={finish.name}
              >
                {finish.imageUrl ? (
                  <img
                    src={finish.imageUrl}
                    alt={finish.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : finish.colorHex ? (
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: finish.colorHex }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">N/A</span>
                  </div>
                )}
                
                {selectedFinish?.id === finish.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                {/* Delete button for custom finishes */}
                {finish.isCustom && (
                  <button
                    onClick={(e) => handleDeleteCustomFinish(e, finish)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 rounded bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 className="h-2.5 w-2.5 text-white" />
                  </button>
                )}

                {/* Hover tooltip */}
                <div className="absolute inset-x-0 bottom-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <p className="text-[8px] text-white truncate text-center">{finish.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Upload Custom Finish Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowUploader(true)}
        className="w-full text-xs"
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        Upload Custom Finish
      </Button>

      {/* Selected Finish Preview */}
      {selectedFinish && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <div 
            className="h-8 w-8 rounded border border-border/50"
            style={{ 
              backgroundColor: selectedFinish.colorHex,
              backgroundImage: selectedFinish.imageUrl ? `url(${selectedFinish.imageUrl})` : undefined,
              backgroundSize: 'cover'
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selectedFinish.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedFinish.category}</p>
          </div>
          <button
            onClick={() => onFinishSelect(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Upload Dialog */}
      <CustomFinishUploader
        open={showUploader}
        onOpenChange={setShowUploader}
        onUploadComplete={loadCustomFinishes}
      />
    </div>
  );
}
