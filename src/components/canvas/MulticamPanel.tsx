import { useState } from 'react';
import { Camera, Eye, ArrowUp, ArrowRight, Box, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CameraView = 'perspective' | 'front' | 'side' | 'top';

interface MulticamPanelProps {
  onGenerateView: (view: CameraView) => void;
  isGenerating: boolean;
  generatedViews: Record<CameraView, string | null>;
  onSelectView: (view: CameraView, imageUrl: string) => void;
  onClose: () => void;
}

const VIEW_OPTIONS: { id: CameraView; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'perspective', 
    label: 'Perspective', 
    icon: <Box className="h-4 w-4" />,
    description: '3/4 angle view'
  },
  { 
    id: 'front', 
    label: 'Front', 
    icon: <Eye className="h-4 w-4" />,
    description: 'Straight-on view'
  },
  { 
    id: 'side', 
    label: 'Side', 
    icon: <ArrowRight className="h-4 w-4" />,
    description: 'Left or right view'
  },
  { 
    id: 'top', 
    label: "Bird's Eye", 
    icon: <ArrowUp className="h-4 w-4" />,
    description: 'Top-down view'
  },
];

export function MulticamPanel({ 
  onGenerateView, 
  isGenerating, 
  generatedViews,
  onSelectView,
  onClose 
}: MulticamPanelProps) {
  const [generatingView, setGeneratingView] = useState<CameraView | null>(null);

  const handleGenerate = (view: CameraView) => {
    setGeneratingView(view);
    onGenerateView(view);
  };

  return (
    <div className="absolute bottom-24 left-4 z-20 w-80 bg-black/80 backdrop-blur-md rounded-lg border border-border/50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Multicam Views</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* View Grid */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {VIEW_OPTIONS.map((view) => {
          const hasImage = !!generatedViews[view.id];
          const isCurrentlyGenerating = isGenerating && generatingView === view.id;
          
          return (
            <div
              key={view.id}
              className={cn(
                "relative rounded-lg border overflow-hidden transition-all",
                hasImage 
                  ? "border-primary/50 bg-primary/10" 
                  : "border-border/30 bg-muted/20 hover:border-primary/30"
              )}
            >
              {/* Thumbnail or placeholder */}
              <div className="aspect-video relative">
                {hasImage ? (
                  <img 
                    src={generatedViews[view.id]!} 
                    alt={view.label}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onSelectView(view.id, generatedViews[view.id]!)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    {isCurrentlyGenerating ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <div className="p-2 rounded-full bg-muted/30">
                          {view.icon}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{view.description}</span>
                      </>
                    )}
                  </div>
                )}
                
                {/* Regenerate overlay for existing images */}
                {hasImage && !isCurrentlyGenerating && (
                  <div 
                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate(view.id);
                    }}
                  >
                    <span className="text-xs text-white">Regenerate</span>
                  </div>
                )}
              </div>

              {/* Label and action */}
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs font-medium">{view.label}</span>
                {!hasImage && !isCurrentlyGenerating && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleGenerate(view.id)}
                    disabled={isGenerating}
                  >
                    Generate
                  </Button>
                )}
                {isCurrentlyGenerating && (
                  <span className="text-[10px] text-muted-foreground">Generating...</span>
                )}
                {hasImage && !isCurrentlyGenerating && (
                  <span className="text-[10px] text-primary">✓ Ready</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="p-3 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            VIEW_OPTIONS.forEach(v => {
              if (!generatedViews[v.id]) {
                handleGenerate(v.id);
              }
            });
          }}
          disabled={isGenerating || VIEW_OPTIONS.every(v => !!generatedViews[v.id])}
        >
          <Camera className="h-3 w-3 mr-2" />
          Generate All Views
        </Button>
      </div>
    </div>
  );
}
