import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zone, PolygonPoint } from './ZoneSelector';
import { ZonePreviewConfirm } from './ZonePreviewConfirm';

interface ZonesPanelProps {
  projectId: string;
  renderUrl: string | null;
  onZoneSelect: (zone: Zone | null) => void;
  selectedZoneId: string | null;
  onStartDrawing: () => void;
  onGenerateZoneView: (zone: Zone) => void;
  isGenerating: boolean;
  onClose: () => void;
}

export function ZonesPanel({
  projectId,
  renderUrl,
  onZoneSelect,
  selectedZoneId,
  onStartDrawing,
  onGenerateZoneView,
  isGenerating,
  onClose,
}: ZonesPanelProps) {
  const [previewZone, setPreviewZone] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, [projectId]);

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staging_zones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setZones(data?.map(z => ({
        id: z.id,
        name: z.name,
        polygon_points: (z.polygon_points as unknown as PolygonPoint[] | null) || [],
        x_start: Number(z.x_start),
        y_start: Number(z.y_start),
        x_end: Number(z.x_end),
        y_end: Number(z.y_end),
        camera_position: z.camera_position || undefined,
      })) || []);
    } catch (error) {
      console.error('Failed to load zones:', error);
      toast.error('Failed to load zones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('staging_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      setZones(prev => prev.filter(z => z.id !== zoneId));
      if (selectedZoneId === zoneId) {
        onZoneSelect(null);
      }
      toast.success('Zone deleted');
    } catch (error) {
      console.error('Failed to delete zone:', error);
      toast.error('Failed to delete zone');
    }
  };

  // Generate SVG points for zone thumbnail
  const getZoneThumbnailPoints = (points: PolygonPoint[]): string => {
    if (!points || points.length < 3) return '';
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  return (
    <div className="absolute bottom-24 right-4 z-20 w-72 bg-black/80 backdrop-blur-md rounded-lg border border-border/50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Zones</span>
          <span className="text-xs text-muted-foreground">({zones.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onStartDrawing}
            disabled={!renderUrl}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Zone
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Zones list */}
      <div className="max-h-64 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No zones defined</p>
            <p className="text-[10px] mt-1">Click "Add Zone" to draw a polygon zone on your render</p>
          </div>
        ) : (
          <div className="space-y-1">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer",
                  selectedZoneId === zone.id
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-muted/30 border border-transparent"
                )}
                onClick={() => onZoneSelect(zone)}
              >
                {/* Zone preview (polygon shape) */}
                <div 
                  className="w-8 h-8 rounded bg-muted/50 relative overflow-hidden flex-shrink-0"
                  title={`${zone.polygon_points?.length || 0} points`}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {zone.polygon_points && zone.polygon_points.length >= 3 ? (
                      <polygon
                        points={getZoneThumbnailPoints(zone.polygon_points)}
                        className="fill-amber-500/60 stroke-amber-500"
                        strokeWidth="3"
                      />
                    ) : (
                      <rect
                        x={zone.x_start}
                        y={zone.y_start}
                        width={zone.x_end - zone.x_start}
                        height={zone.y_end - zone.y_start}
                        className="fill-amber-500/60 stroke-amber-500"
                        strokeWidth="3"
                      />
                    )}
                  </svg>
                </div>

                {/* Zone info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{zone.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {zone.polygon_points && zone.polygon_points.length >= 3 
                      ? `${zone.polygon_points.length} points`
                      : `${(zone.x_end - zone.x_start).toFixed(0)}% × ${(zone.y_end - zone.y_start).toFixed(0)}%`
                    }
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewZone(zone);
                    }}
                    disabled={isGenerating || !renderUrl}
                    title="Preview and generate view of this zone"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZone(zone.id);
                    }}
                    title="Delete zone"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      {zones.length > 0 && (
        <div className="p-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Click a zone to select, then generate focused views
          </p>
        </div>
      )}

      {/* Zone Preview Confirmation Modal */}
      {previewZone && renderUrl && (
        <ZonePreviewConfirm
          zone={previewZone}
          renderUrl={renderUrl}
          isGenerating={isGenerating}
          onConfirm={() => {
            onGenerateZoneView(previewZone);
            setPreviewZone(null);
          }}
          onCancel={() => setPreviewZone(null)}
        />
      )}
    </div>
  );
}
