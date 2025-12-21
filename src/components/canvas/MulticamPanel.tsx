import { useState } from 'react';
import { Camera, Eye, ArrowUp, ArrowRight, Box, Loader2, X, Download, Presentation, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import pptxgen from 'pptxgenjs';

export type CameraView = 'perspective' | 'front' | 'side' | 'top' | 'custom';

interface MulticamPanelProps {
  onGenerateView: (view: CameraView, customPrompt?: string) => void;
  isGenerating: boolean;
  generatedViews: Record<CameraView, string | null>;
  onSelectView: (view: CameraView, imageUrl: string) => void;
  onClose: () => void;
  onSetAsMain?: (imageUrl: string) => void;
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
  { 
    id: 'custom', 
    label: 'Custom', 
    icon: <Edit2 className="h-4 w-4" />,
    description: 'Your own angle'
  },
];

export function MulticamPanel({ 
  onGenerateView, 
  isGenerating, 
  generatedViews,
  onSelectView,
  onClose,
  onSetAsMain 
}: MulticamPanelProps) {
  const { toast } = useToast();
  const [generatingView, setGeneratingView] = useState<CameraView | null>(null);
  const [customAngle, setCustomAngle] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = (view: CameraView, customPrompt?: string) => {
    setGeneratingView(view);
    onGenerateView(view, customPrompt);
  };

  const handleCustomGenerate = () => {
    if (!customAngle.trim()) return;
    handleGenerate('custom', customAngle.trim());
    setShowCustomInput(false);
  };

  const handleSetAsMain = (view: CameraView, imageUrl: string) => {
    if (onSetAsMain) {
      onSetAsMain(imageUrl);
      toast({ title: 'Main render updated', description: `${view} view set as main render.` });
    }
  };

  const handleDownloadAll = async () => {
    const viewsWithImages = Object.entries(generatedViews).filter(([_, url]) => url !== null);
    if (viewsWithImages.length === 0) {
      toast({ variant: 'destructive', title: 'No views to download' });
      return;
    }

    setIsExporting(true);
    try {
      // Download each image and create a zip-like experience (download all sequentially)
      for (const [view, url] of viewsWithImages) {
        if (!url) continue;
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `multicam-${view}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 300));
      }
      toast({ title: 'Downloaded all views!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Download failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToPPT = async () => {
    const viewsWithImages = Object.entries(generatedViews).filter(([_, url]) => url !== null);
    if (viewsWithImages.length === 0) {
      toast({ variant: 'destructive', title: 'No views to export' });
      return;
    }

    setIsExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.author = 'Design Studio';
      pptx.title = 'Multicam Views';
      pptx.subject = 'Room Design Views';

      for (const [view, url] of viewsWithImages) {
        if (!url) continue;
        const slide = pptx.addSlide();
        
        // Add title
        slide.addText(view.charAt(0).toUpperCase() + view.slice(1) + ' View', {
          x: 0.5,
          y: 0.3,
          w: '90%',
          h: 0.5,
          fontSize: 24,
          bold: true,
          color: '363636',
        });

        // Add image
        slide.addImage({
          path: url,
          x: 0.5,
          y: 1,
          w: 9,
          h: 5,
          sizing: { type: 'contain', w: 9, h: 5 },
        });
      }

      await pptx.writeFile({ fileName: `multicam-views-${Date.now()}.pptx` });
      toast({ title: 'PowerPoint exported!' });
    } catch (error) {
      console.error('PPT export failed:', error);
      toast({ variant: 'destructive', title: 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const hasAnyViews = Object.values(generatedViews).some(v => v !== null);

  return (
    <div className="absolute bottom-24 left-4 z-20 w-96 bg-black/80 backdrop-blur-md rounded-lg border border-border/50 shadow-xl overflow-hidden">
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
      <div className="p-3 grid grid-cols-3 gap-2">
        {VIEW_OPTIONS.map((view) => {
          const hasImage = !!generatedViews[view.id];
          const isCurrentlyGenerating = isGenerating && generatingView === view.id;
          
          // Special handling for custom view
          if (view.id === 'custom') {
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
                <div className="aspect-video relative">
                  {hasImage ? (
                    <>
                      <img 
                        src={generatedViews[view.id]!} 
                        alt={view.label}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onSelectView(view.id, generatedViews[view.id]!)}
                      />
                      {/* Set as Main overlay */}
                      {onSetAsMain && (
                        <div 
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetAsMain(view.id, generatedViews[view.id]!);
                          }}
                        >
                          <Check className="h-4 w-4 text-white" />
                          <span className="text-[10px] text-white">Set as Main</span>
                        </div>
                      )}
                    </>
                  ) : showCustomInput ? (
                    <div className="absolute inset-0 p-2 flex flex-col gap-1">
                      <Input
                        value={customAngle}
                        onChange={(e) => setCustomAngle(e.target.value)}
                        placeholder="e.g., 45° from corner"
                        className="h-6 text-[10px] bg-background/80"
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomGenerate()}
                      />
                      <Button size="sm" className="h-5 text-[10px]" onClick={handleCustomGenerate}>
                        Go
                      </Button>
                    </div>
                  ) : isCurrentlyGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer"
                      onClick={() => setShowCustomInput(true)}
                    >
                      <div className="p-2 rounded-full bg-muted/30">
                        {view.icon}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{view.description}</span>
                    </div>
                  )}
                </div>
                <div className="p-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium">{view.label}</span>
                  {hasImage && !isCurrentlyGenerating && (
                    <span className="text-[8px] text-primary">✓</span>
                  )}
                </div>
              </div>
            );
          }
          
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
                  <>
                    <img 
                      src={generatedViews[view.id]!} 
                      alt={view.label}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onSelectView(view.id, generatedViews[view.id]!)}
                    />
                    {/* Set as Main overlay */}
                    {onSetAsMain && (
                      <div 
                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsMain(view.id, generatedViews[view.id]!);
                        }}
                      >
                        <Check className="h-4 w-4 text-white" />
                        <span className="text-[10px] text-white">Set as Main</span>
                      </div>
                    )}
                  </>
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
              </div>

              {/* Label and action */}
              <div className="p-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium">{view.label}</span>
                {!hasImage && !isCurrentlyGenerating && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px]"
                    onClick={() => handleGenerate(view.id)}
                    disabled={isGenerating}
                  >
                    Gen
                  </Button>
                )}
                {isCurrentlyGenerating && (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                )}
                {hasImage && !isCurrentlyGenerating && (
                  <span className="text-[8px] text-primary">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export actions */}
      {hasAnyViews && (
        <div className="p-3 border-t border-border/30 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleDownloadAll}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Download All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleExportToPPT}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Presentation className="h-3 w-3" />}
            Export PPT
          </Button>
        </div>
      )}

      {/* Quick actions */}
      <div className="p-3 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            VIEW_OPTIONS.filter(v => v.id !== 'custom').forEach(v => {
              if (!generatedViews[v.id]) {
                handleGenerate(v.id);
              }
            });
          }}
          disabled={isGenerating || VIEW_OPTIONS.filter(v => v.id !== 'custom').every(v => !!generatedViews[v.id])}
        >
          <Camera className="h-3 w-3 mr-2" />
          Generate All Standard Views
        </Button>
      </div>
    </div>
  );
}
