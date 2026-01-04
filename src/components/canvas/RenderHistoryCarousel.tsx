import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { History, ChevronDown, ChevronUp, Trash2, Camera, Paintbrush, Layers, Eye, Sparkles, Columns2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface RenderHistoryItem {
  id: string;
  render_url: string;
  prompt: string;
  parent_render_id: string | null;
  created_at: string;
  view_type?: string;
}

interface RenderHistoryCarouselProps {
  renders: RenderHistoryItem[];
  currentRenderId: string | null;
  onSelect: (render: RenderHistoryItem) => void;
  onDelete?: (renderId: string) => void;
  onCompareZone?: () => void;
  hasZoneComparison?: boolean;
}

export function RenderHistoryCarousel({
  renders,
  currentRenderId,
  onSelect,
  onDelete,
  onCompareZone,
  hasZoneComparison,
}: RenderHistoryCarouselProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (renders.length === 0) return null;

  const handleDelete = (renderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(renderId);
      setDeletingId(null);
    }
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
      <div className="glass-premium rounded-xl border border-border/20 overflow-hidden">
        {/* Header - Always visible, clickable to toggle */}
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:bg-muted/20 transition-colors rounded px-2 py-1 -ml-2"
          >
            <History className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Render History
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              ({renders.length})
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {/* Compare Zone Button */}
          {hasZoneComparison && onCompareZone && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCompareZone}
              className="h-7 gap-1.5 text-xs border-primary/30 hover:bg-primary/10"
            >
              <Columns2 className="h-3.5 w-3.5" />
              Compare Zone
            </Button>
          )}
        </div>
        
        {/* Collapsible content */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-3 pb-3">
            <Carousel
              opts={{
                align: 'center',
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {renders.map((render, index) => {
                  const isCurrent = render.id === currentRenderId;
                  const timestamp = new Date(render.created_at);
                  
                  // Get view type badge info
                  const getViewTypeBadge = () => {
                    const viewType = render.view_type || 'original';
                    const badges: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
                      original: { icon: <Sparkles className="h-2.5 w-2.5" />, label: 'Original', color: 'bg-primary/80' },
                      edit: { icon: <Paintbrush className="h-2.5 w-2.5" />, label: 'Edit', color: 'bg-amber-500/80' },
                      composite: { icon: <Layers className="h-2.5 w-2.5" />, label: 'Staged', color: 'bg-emerald-500/80' },
                      view_perspective: { icon: <Camera className="h-2.5 w-2.5" />, label: '3/4', color: 'bg-blue-500/80' },
                      view_front: { icon: <Eye className="h-2.5 w-2.5" />, label: 'Front', color: 'bg-blue-500/80' },
                      view_side: { icon: <Eye className="h-2.5 w-2.5" />, label: 'Side', color: 'bg-blue-500/80' },
                      view_top: { icon: <Eye className="h-2.5 w-2.5" />, label: 'Top', color: 'bg-blue-500/80' },
                      view_cinematic: { icon: <Camera className="h-2.5 w-2.5" />, label: 'Cine', color: 'bg-purple-500/80' },
                      view_custom: { icon: <Camera className="h-2.5 w-2.5" />, label: 'View', color: 'bg-blue-500/80' },
                    };
                    return badges[viewType] || badges.original;
                  };
                  
                  const badge = getViewTypeBadge();
                  
                  return (
                    <CarouselItem key={render.id} className="pl-2 basis-1/4 sm:basis-1/5">
                      <div className="relative group">
                        <button
                          onClick={() => onSelect(render)}
                          className={cn(
                            'relative w-full aspect-video rounded-lg overflow-hidden',
                            'border transition-all duration-200',
                            'hover:scale-105 hover:z-10',
                            isCurrent
                              ? 'border-primary ring-1 ring-primary/40'
                              : 'border-border/30 hover:border-primary/50'
                          )}
                        >
                          <img
                            src={render.render_url}
                            alt={`Render ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            draggable={false}
                          />
                          
                          {/* Current badge */}
                          {isCurrent && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary/90 backdrop-blur-sm rounded text-[10px] font-medium text-primary-foreground">
                              Current
                            </div>
                          )}
                          
                          {/* View type badge - show when not current */}
                          {!isCurrent && render.view_type && render.view_type !== 'original' && (
                            <div className={cn(
                              'absolute top-1 right-1 px-1.5 py-0.5 backdrop-blur-sm rounded text-[10px] font-medium text-white flex items-center gap-1',
                              badge.color
                            )}>
                              {badge.icon}
                              {badge.label}
                            </div>
                          )}
                          
                          {/* Timestamp overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-1">
                            <span className="text-[10px] font-mono text-foreground/80">
                              {format(timestamp, 'HH:mm')}
                            </span>
                          </div>
                          
                          {/* Version number */}
                          <div className="absolute top-1 left-1 w-5 h-5 rounded glass flex items-center justify-center">
                            <span className="text-[10px] font-mono text-foreground">
                              {renders.length - index}
                            </span>
                          </div>
                        </button>

                        {/* Delete button - only show for non-current renders */}
                        {!isCurrent && onDelete && (
                          <AlertDialog open={deletingId === render.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(render.id);
                                }}
                                className={cn(
                                  'absolute -top-2 -right-2 p-1.5 rounded-full',
                                  'bg-destructive/90 text-destructive-foreground',
                                  'opacity-0 group-hover:opacity-100 transition-opacity',
                                  'hover:bg-destructive shadow-lg',
                                  'z-20'
                                )}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Render?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete version {renders.length - index} from your render history. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={(e) => handleDelete(render.id, e)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-0 h-8 w-8 glass border-border/30 hover:bg-primary/20" />
              <CarouselNext className="right-0 h-8 w-8 glass border-border/30 hover:bg-primary/20" />
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
}