import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

export interface RenderHistoryItem {
  id: string;
  render_url: string;
  prompt: string;
  parent_render_id: string | null;
  created_at: string;
}

interface RenderHistoryCarouselProps {
  renders: RenderHistoryItem[];
  currentRenderId: string | null;
  onSelect: (render: RenderHistoryItem) => void;
}

export function RenderHistoryCarousel({
  renders,
  currentRenderId,
  onSelect,
}: RenderHistoryCarouselProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (renders.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
      <div className="glass-premium rounded-xl border border-border/20 overflow-hidden">
        {/* Header - Always visible, clickable to toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Render History
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {renders.length} version{renders.length !== 1 ? 's' : ''}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
        
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
                  
                  return (
                    <CarouselItem key={render.id} className="pl-2 basis-1/4 sm:basis-1/5">
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
