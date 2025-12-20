import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  if (renders.length === 0) return null;

  return (
    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4">
      <div className="bg-black/70 backdrop-blur-md rounded-xl border border-border/30 p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Render History
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {renders.length} render{renders.length !== 1 ? 's' : ''}
          </span>
        </div>
        
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
                      'border-2 transition-all duration-200',
                      'hover:scale-105 hover:z-10',
                      isCurrent
                        ? 'border-primary ring-2 ring-primary/30'
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
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-primary rounded text-[10px] font-medium text-primary-foreground">
                        Current
                      </div>
                    )}
                    
                    {/* Timestamp overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-[10px] font-mono text-white/80">
                        {format(timestamp, 'HH:mm')}
                      </span>
                    </div>
                    
                    {/* Version number */}
                    <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-white">
                        {renders.length - index}
                      </span>
                    </div>
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-0 h-8 w-8" />
          <CarouselNext className="right-0 h-8 w-8" />
        </Carousel>
      </div>
    </div>
  );
}
