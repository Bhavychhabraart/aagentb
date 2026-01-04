import { useState, useEffect } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cropRectangleFromImage } from '@/utils/cropZoneImage';
import { Zone } from './ZoneSelector';
import { cn } from '@/lib/utils';

export type ViewType = 'detail' | 'cinematic' | 'eye-level' | 'dramatic' | 'bird-eye';

const viewTypeOptions: { value: ViewType; label: string; description: string }[] = [
  { value: 'detail', label: 'Detail', description: 'Close-up focus' },
  { value: 'cinematic', label: 'Cinematic', description: 'Wide dramatic' },
  { value: 'eye-level', label: 'Eye Level', description: 'Standing view' },
  { value: 'dramatic', label: 'Dramatic', description: 'Low angle' },
  { value: 'bird-eye', label: 'Bird Eye', description: 'Top-down' },
];

interface ZonePreviewConfirmProps {
  zone: Zone;
  layoutImageUrl: string;
  onConfirm: (viewType: ViewType) => void;
  onCancel: () => void;
  isGenerating: boolean;
}

export function ZonePreviewConfirm({
  zone,
  layoutImageUrl,
  onConfirm,
  onCancel,
  isGenerating,
}: ZonePreviewConfirmProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewType, setSelectedViewType] = useState<ViewType>('detail');

  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Loading zone preview:', zone.name);
        console.log('Zone bounds:', { 
          x_start: zone.x_start, 
          y_start: zone.y_start, 
          x_end: zone.x_end, 
          y_end: zone.y_end 
        });
        
        // Use optimized rectangle cropping with clamped coordinates
        const cropped = await cropRectangleFromImage(layoutImageUrl, {
          x_start: zone.x_start,
          y_start: zone.y_start,
          x_end: zone.x_end,
          y_end: zone.y_end,
        });
        
        console.log('Cropped image generated successfully');
        setPreviewUrl(cropped);
      } catch (err) {
        console.error('Failed to crop zone preview:', err);
        setError('Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [zone, layoutImageUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold">Zone Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This area from your layout will be rendered
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCancel}
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview area */}
        <div className="p-4">
          <div className="rounded-lg border border-border/50 overflow-hidden bg-muted/30 aspect-video flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Loading preview...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-destructive">
                <span className="text-xs">{error}</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={`Preview of zone: ${zone.name}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>

          {/* Zone info */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{zone.name}</span>
            <span>
              {`${(zone.x_end - zone.x_start).toFixed(0)}% × ${(zone.y_end - zone.y_start).toFixed(0)}%`}
            </span>
          </div>

          {/* View Type Selection */}
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">View Type</label>
            <div className="grid grid-cols-5 gap-1">
              {viewTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedViewType(option.value)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg border text-center transition-all",
                    selectedViewType === option.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="text-[10px] font-medium leading-tight">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-border/50 bg-muted/20">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => onConfirm(selectedViewType)}
            disabled={isLoading || !!error || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Generate View
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
