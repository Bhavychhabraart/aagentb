import { useState, useEffect } from 'react';
import { Camera, Loader2, X, Download, Presentation, Grid2X2, RefreshCw, Layers, Plus, Building, Newspaper, Focus, Sparkles, Layout, Users, Film, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import pptxgen from 'pptxgenjs';
import { supabase } from '@/integrations/supabase/client';
import { Zone } from './ZoneSelector';

export type CameraView = 'perspective' | 'front' | 'side' | 'top' | 'cinematic' | 'custom';

export interface ZoneRegion {
  x_start: number;
  y_start: number;
  x_end: number;
  y_end: number;
}

interface GridPreset {
  id: string;
  name: string;
  views: string[];
  description: string;
}

const GRID_PRESETS: GridPreset[] = [
  { id: 'standard', name: 'Standard Views', views: ['eye-level', 'overhead', 'wide', 'macro'], description: 'Eye Level • Overhead • Wide • Detail' },
  { id: 'cinematic', name: 'Cinematic Pack', views: ['dramatic', 'low', 'photographer', 'fisheye'], description: 'Dramatic • Low • Editorial • Fish-Eye' },
  { id: 'architectural', name: 'Architectural', views: ['straight-on', 'corner', 'top-down', 'isometric'], description: 'Symmetrical • Corner • Top-Down • Isometric' },
  { id: 'magazine', name: 'Magazine Style', views: ['photographer', 'eye-level', 'wide', 'macro'], description: 'Editorial • Eye Level • Wide • Close-Up' },
  { id: 'presentation', name: 'Presentation', views: ['eye-level', 'corner', 'top-down', 'wide'], description: 'Eye Level • Corner • Plan View • Wide' },
  { id: 'detail', name: 'Detail Focus', views: ['macro', 'low', 'eye-level', 'photographer'], description: 'Close-Up • Hero • Eye Level • Editorial' },
  { id: 'dramatic', name: 'Dramatic Angles', views: ['fisheye', 'low', 'dramatic', 'corner'], description: 'Fish-Eye • Hero • Moody • Corner' },
  { id: 'overview', name: 'Full Overview', views: ['overhead', 'top-down', 'isometric', 'wide'], description: 'Overhead • Plan • Isometric • Wide' },
  { id: 'client', name: 'Client Ready', views: ['eye-level', 'corner', 'photographer', 'wide'], description: 'Eye Level • Corner • Editorial • Wide' },
];

interface MulticamPanelProps {
  onGenerateView: (view: CameraView, customPrompt?: string, zone?: ZoneRegion) => void;
  isGenerating: boolean;
  generatedViews: Record<CameraView, string | null>;
  onSelectView: (view: CameraView, imageUrl: string) => void;
  onClose: () => void;
  onSetAsMain?: (imageUrl: string) => void;
  projectId?: string;
  onStartZoneDrawing?: () => void;
  currentRenderUrl?: string;
  styleRefUrls?: string[];
  onSaveToHistory?: (imageUrl: string, prompt: string, viewType: string) => void;
  userId?: string;
}

export function MulticamPanel({ 
  onGenerateView, 
  isGenerating, 
  generatedViews,
  onSelectView,
  onClose,
  onSetAsMain,
  projectId,
  onStartZoneDrawing,
  currentRenderUrl,
  styleRefUrls,
  onSaveToHistory,
  userId,
}: MulticamPanelProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isGeneratingGrid, setIsGeneratingGrid] = useState(false);
  const [compositeGridUrl, setCompositeGridUrl] = useState<string | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  const selectedPreset = GRID_PRESETS[selectedPresetIndex];

  // Load zones when projectId changes
  useEffect(() => {
    if (projectId) {
      loadZones();
    }
  }, [projectId]);

  const loadZones = async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from('staging_zones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setZones(data.map(z => ({
        id: z.id,
        name: z.name,
        polygon_points: (z.polygon_points as { x: number; y: number }[] | null) || [],
        x_start: Number(z.x_start),
        y_start: Number(z.y_start),
        x_end: Number(z.x_end),
        y_end: Number(z.y_end),
        camera_position: z.camera_position || undefined,
      })));
    }
  };

  // Generate 2x2 grid using the composite endpoint
  const handleGenerateGrid = async () => {
    if (!currentRenderUrl) {
      toast({ variant: 'destructive', title: 'No render available', description: 'Please generate a render first.' });
      return;
    }

    setIsGeneratingGrid(true);
    
    try {
      const zone = selectedZone ? {
        x_start: selectedZone.x_start,
        y_start: selectedZone.y_start,
        x_end: selectedZone.x_end,
        y_end: selectedZone.y_end,
      } : undefined;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-multicam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          mode: 'grid',
          views: selectedPreset.views,
          styleRefUrls,
          zone,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('Usage limit reached. Please add credits.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate grid');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setCompositeGridUrl(data.imageUrl);
        toast({ 
          title: '2x2 Grid Generated!', 
          description: `${selectedPreset.name} - All 4 camera angles in one image.` 
        });

        // Save to render history
        if (onSaveToHistory) {
          onSaveToHistory(data.imageUrl, `Multicam Grid: ${selectedPreset.name}`, 'multicam_grid');
        }
      }
    } catch (error) {
      console.error('Generate grid error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Generation failed', 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsGeneratingGrid(false);
    }
  };

  const handleDownloadGrid = async () => {
    if (!compositeGridUrl) return;
    
    try {
      const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
      const response = await fetch(compositeGridUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = formatDownloadFilename('multicam', selectedPreset.id, 'png');
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast({ title: 'Grid downloaded!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Download failed' });
    }
  };

  const handleExportToPPT = async () => {
    if (!compositeGridUrl) {
      toast({ variant: 'destructive', title: 'No grid to export' });
      return;
    }

    setIsExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.author = 'Design Studio';
      pptx.title = `Camera Views - ${selectedPreset.name}`;
      pptx.subject = 'Room Design - 4 Camera Angles';

      const slide = pptx.addSlide();
      
      // Add title
      slide.addText(`Camera Views - ${selectedPreset.name}`, {
        x: 0.5,
        y: 0.3,
        w: '90%',
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: '363636',
      });

      // Add subtitle with view labels
      slide.addText(selectedPreset.description, {
        x: 0.5,
        y: 0.8,
        w: '90%',
        h: 0.3,
        fontSize: 12,
        color: '666666',
      });

      // Add the composite grid image
      slide.addImage({
        path: compositeGridUrl,
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 5,
        sizing: { type: 'contain', w: 9, h: 5 },
      });

      const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
      await pptx.writeFile({ fileName: formatDownloadFilename('ppt', `camera-views-${selectedPreset.id}`, 'pptx') });
      toast({ title: 'PowerPoint exported!' });
    } catch (error) {
      console.error('PPT export failed:', error);
      toast({ variant: 'destructive', title: 'Export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSetAsMain = () => {
    if (compositeGridUrl && onSetAsMain) {
      onSetAsMain(compositeGridUrl);
      toast({ title: 'Grid set as main render' });
    }
  };

  const handlePrevPreset = () => {
    setSelectedPresetIndex((prev) => (prev === 0 ? GRID_PRESETS.length - 1 : prev - 1));
    setCompositeGridUrl(null);
  };

  const handleNextPreset = () => {
    setSelectedPresetIndex((prev) => (prev === GRID_PRESETS.length - 1 ? 0 : prev + 1));
    setCompositeGridUrl(null);
  };

  return (
    <div className="absolute bottom-24 left-4 z-20 w-80 bg-black/80 backdrop-blur-md rounded-lg border border-border/50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Grid2X2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Camera Views</span>
          {selectedZone && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
              {selectedZone.name}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Grid Preset Selector */}
      <div className="px-3 py-2 border-b border-border/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Grid Style</span>
          <span className="text-[10px] text-muted-foreground">{selectedPresetIndex + 1} / {GRID_PRESETS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handlePrevPreset}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium text-foreground">{selectedPreset.name}</p>
            <p className="text-[10px] text-muted-foreground">{selectedPreset.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleNextPreset}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone selector */}
      {zones.length > 0 && (
        <div className="px-3 py-2 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Focus Zone</span>
            </div>
            {onStartZoneDrawing && (
              <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={onStartZoneDrawing}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedZone === null ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-[10px]"
              onClick={() => setSelectedZone(null)}
            >
              Full Room
            </Button>
            {zones.map((zone) => (
              <Button
                key={zone.id}
                variant={selectedZone?.id === zone.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 text-[10px]",
                  selectedZone?.id === zone.id && "bg-amber-500/20 text-amber-400"
                )}
                onClick={() => setSelectedZone(zone)}
              >
                {zone.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Grid Preview or Placeholder */}
      <div className="p-4">
        {compositeGridUrl ? (
          <div className="space-y-3">
            <img 
              src={compositeGridUrl} 
              alt="2x2 Camera Grid" 
              className="w-full rounded-lg border border-border/30 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleSetAsMain}
            />
            <p className="text-[10px] text-muted-foreground text-center">
              Click image to set as main render
            </p>
          </div>
        ) : (
          <div className="aspect-square bg-muted/10 rounded-lg border border-dashed border-border/30 flex flex-col items-center justify-center p-4">
            <Grid2X2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground/80 mb-1">2x2 Camera Grid</p>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Generate a single image with 4 different camera angles of your room
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1 text-[9px] text-muted-foreground/70">
              {selectedPreset.views.map((view, idx) => (
                <span key={idx} className="px-2 py-1 bg-muted/10 rounded capitalize">
                  {view.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="px-4 pb-3">
        <Button
          variant="default"
          size="sm"
          className="w-full text-sm gap-2"
          onClick={handleGenerateGrid}
          disabled={isGeneratingGrid || !currentRenderUrl}
        >
          {isGeneratingGrid ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Grid...
            </>
          ) : compositeGridUrl ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Regenerate Grid
            </>
          ) : (
            <>
              <Grid2X2 className="h-4 w-4" />
              Generate 2x2 Grid
            </>
          )}
        </Button>
      </div>

      {/* Export Actions (shown when grid exists) */}
      {compositeGridUrl && (
        <div className="px-4 pb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleDownloadGrid}
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleExportToPPT}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Presentation className="h-3 w-3" />
            )}
            Export PPT
          </Button>
        </div>
      )}
    </div>
  );
}