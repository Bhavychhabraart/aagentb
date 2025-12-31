import { useState, useEffect } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cropPolygonFromRender, cropZoneFromRender } from '@/utils/cropZoneImage';
import { Zone } from './ZoneSelector';

interface ZonePreviewConfirmProps {
  zone: Zone;
  renderUrl: string;
  onConfirm: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

export function ZonePreviewConfirm({
  zone,
  renderUrl,
  onConfirm,
  onCancel,
  isGenerating,
}: ZonePreviewConfirmProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let cropped: string;
        
        // Use polygon cropping if polygon points exist, otherwise fall back to rectangle
        if (zone.polygon_points && zone.polygon_points.length >= 3) {
          cropped = await cropPolygonFromRender(renderUrl, zone.polygon_points);
        } else {
          // Fallback for legacy rectangular zones
          cropped = await cropZoneFromRender(renderUrl, {
            x: zone.x_start,
            y: zone.y_start,
            width: zone.x_end - zone.x_start,
            height: zone.y_end - zone.y_start,
          });
        }
        
        setPreviewUrl(cropped);
      } catch (err) {
        console.error('Failed to crop zone preview:', err);
        setError('Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [zone, renderUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold">Zone Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confirm this is the correct area
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
              {zone.polygon_points && zone.polygon_points.length >= 3 
                ? `${zone.polygon_points.length} point polygon`
                : `${(zone.x_end - zone.x_start).toFixed(0)}% × ${(zone.y_end - zone.y_start).toFixed(0)}%`
              }
            </span>
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
            onClick={onConfirm}
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
