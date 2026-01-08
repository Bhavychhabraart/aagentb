import { useState } from 'react';
import { Check, Home, Eye, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { formatINR } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealspaceViewProps {
  items: CatalogFurnitureItem[];
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
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

// Room context suggestions based on category
const getRoomContext = (category: string, subcategory?: string): string => {
  const contexts: Record<string, string> = {
    'Seating': 'living-room',
    'Tables': 'dining-room',
    'Storage': 'bedroom',
    'Beds': 'bedroom',
    'Lighting': 'living-room',
    'Decor': 'entryway',
    'Sofas': 'living-room',
    'Chairs': 'office',
    'Dining': 'dining-room',
    'Office': 'office',
  };
  return contexts[subcategory || ''] || contexts[category] || 'living-room';
};

const getRoomLabel = (roomValue: string): string => {
  const room = ROOM_OPTIONS.find(r => r.value === roomValue);
  return room?.label || 'Living Room';
};

export function RealspaceView({ items, selectedItems, onToggleItem, onPreviewItem }: RealspaceViewProps) {
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [realspaceImages, setRealspaceImages] = useState<Map<string, string>>(new Map());
  const [roomTypes, setRoomTypes] = useState<Map<string, string>>(new Map());

  const handleGenerateRealspace = async (item: CatalogFurnitureItem) => {
    if (generating.has(item.id)) return;

    const roomType = roomTypes.get(item.id) || getRoomContext(item.category, item.subcategory);

    setGenerating(prev => new Set(prev).add(item.id));

    try {
      const { data, error } = await supabase.functions.invoke('generate-realspace-image', {
        body: {
          productImageUrl: item.imageUrl,
          productName: item.name,
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
    // Clear existing generated image when room type changes
    if (realspaceImages.has(itemId)) {
      setRealspaceImages(prev => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const isGenerating = generating.has(item.id);
        const generatedImage = realspaceImages.get(item.id);
        const currentRoom = roomTypes.get(item.id) || getRoomContext(item.category, item.subcategory);

        return (
          <Card
            key={item.id}
            className={`group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              isSelected ? 'ring-2 ring-primary shadow-xl' : ''
            }`}
            onClick={() => onPreviewItem?.(item)}
          >
            {/* Room Context Image */}
            <div className="aspect-[16/10] relative bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
              {generatedImage ? (
                // Show AI generated room image
                <img
                  src={generatedImage}
                  alt={`${item.name} in ${getRoomLabel(currentRoom)}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                // Show placeholder with product
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-stone-100/50 to-slate-200/50" />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-w-[70%] max-h-[80%] object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </>
              )}

              {/* Room context badge */}
              <Badge
                variant="secondary"
                className="absolute top-3 left-3 gap-1.5 bg-background/90 backdrop-blur-sm"
              >
                <Home className="h-3 w-3" />
                {getRoomLabel(currentRoom)}
              </Badge>

              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
              )}

              {/* Generate / Regenerate button */}
              <div className="absolute bottom-3 right-3">
                <Button
                  size="sm"
                  variant={generatedImage ? 'outline' : 'default'}
                  className="gap-1.5 bg-background/90 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateRealspace(item);
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : generatedImage ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate View
                    </>
                  )}
                </Button>
              </div>

              {/* View details hint */}
              {!isGenerating && (
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="bg-background/90 backdrop-blur-sm gap-1">
                    <Eye className="h-3 w-3" />
                    View Details
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Room:</span>
                <Select
                  value={currentRoom}
                  onValueChange={(value) => handleRoomChange(item.id, value)}
                >
                  <SelectTrigger
                    className="h-7 text-xs w-auto min-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_OPTIONS.map((room) => (
                      <SelectItem key={room.value} value={room.value}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-1">{item.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xl font-bold text-primary">
                    {formatINR(item.price || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand && `By ${item.brand}`}
                  </p>
                </div>
                <Button
                  variant={isSelected ? 'secondary' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleItem(item);
                  }}
                >
                  {isSelected ? 'Remove' : 'Stage Item'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
