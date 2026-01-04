import { useState, useEffect, useCallback } from 'react';
import { X, Layers, Plus, Trash2, Camera, Edit3 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ZoneSelector, Zone, PolygonPoint } from './ZoneSelector';
import { ZonePreviewConfirm } from './ZonePreviewConfirm';
import { ViewType } from './PremiumWorkspace';

interface LayoutZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  layoutImageUrl: string;
  renderUrl: string | null;
  onZoneCreate: (zone: Omit<Zone, 'id'>, layoutUrl: string) => Promise<void>;
  onZoneDelete: (zoneId: string) => Promise<void>;
  onGenerateZoneView: (zone: Zone, viewType: ViewType) => void;
  isGenerating: boolean;
}

export function LayoutZoneModal({
  isOpen,
  onClose,
  projectId,
  layoutImageUrl,
  renderUrl,
  onZoneCreate,
  onZoneDelete,
  onGenerateZoneView,
  isGenerating,
}: LayoutZoneModalProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [previewZone, setPreviewZone] = useState<Zone | null>(null);

  // Load zones when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadZones();
    }
  }, [isOpen, projectId]);

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

  const handleZoneCreate = useCallback(async (zone: Omit<Zone, 'id'>) => {
    await onZoneCreate(zone, layoutImageUrl);
    await loadZones();
    setIsDrawing(false);
  }, [onZoneCreate, layoutImageUrl]);

  const handleZoneDelete = useCallback(async (zoneId: string) => {
    await onZoneDelete(zoneId);
    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
    }
  }, [onZoneDelete, selectedZoneId]);

  const handleZoneSelect = useCallback((zone: Zone) => {
    setSelectedZoneId(zone.id);
  }, []);

  // Generate SVG points for zone thumbnail
  const getZoneThumbnailPoints = (points: PolygonPoint[]): string => {
    if (!points || points.length < 3) return '';
    return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Layout Zones</h2>
              <p className="text-sm text-muted-foreground">Draw zones on your layout for focused render views</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Layout Canvas - Main Area */}
          <div className="flex-1 relative bg-muted/30 p-4 overflow-hidden">
            {layoutImageUrl ? (
              <ZoneSelector
                imageUrl={layoutImageUrl}
                zones={zones}
                onZoneCreate={handleZoneCreate}
                onZoneDelete={handleZoneDelete}
                onZoneSelect={handleZoneSelect}
                selectedZoneId={selectedZoneId}
                isDrawing={isDrawing}
                onDrawingChange={setIsDrawing}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No layout image available</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Upload a 2D layout to define zones</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Zone List */}
          <div className="w-80 border-l border-border bg-card flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Zones ({zones.length})</span>
                <Button
                  size="sm"
                  onClick={() => setIsDrawing(true)}
                  disabled={!layoutImageUrl || isDrawing}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Zone
                </Button>
              </div>
              {isDrawing && (
                <div className="text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg">
                  Click and drag on the layout to select a rectangular area.
                </div>
              )}
            </div>

            {/* Zone List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No zones defined</p>
                    <p className="text-xs mt-1 text-muted-foreground/70">
                      Click "Add Zone" to start drawing
                    </p>
                  </div>
                ) : (
                  zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer border",
                        selectedZoneId === zone.id
                          ? "bg-primary/10 border-primary/50"
                          : "hover:bg-muted/50 border-transparent hover:border-border"
                      )}
                      onClick={() => handleZoneSelect(zone)}
                    >
                      {/* Zone preview thumbnail */}
                      <div className="w-10 h-10 rounded bg-muted/50 relative overflow-hidden flex-shrink-0 border border-border/50">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {zone.polygon_points && zone.polygon_points.length >= 3 ? (
                            <polygon
                              points={getZoneThumbnailPoints(zone.polygon_points)}
                              className="fill-primary/40 stroke-primary"
                              strokeWidth="3"
                            />
                          ) : (
                            <rect
                              x={zone.x_start}
                              y={zone.y_start}
                              width={zone.x_end - zone.x_start}
                              height={zone.y_end - zone.y_start}
                              className="fill-primary/40 stroke-primary"
                              strokeWidth="3"
                            />
                          )}
                        </svg>
                      </div>

                      {/* Zone info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {`${(zone.x_end - zone.x_start).toFixed(0)}% × ${(zone.y_end - zone.y_start).toFixed(0)}%`}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewZone(zone);
                          }}
                          disabled={isGenerating}
                          title="Generate view of this zone"
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleZoneDelete(zone.id);
                          }}
                          title="Delete zone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer info */}
            {zones.length > 0 && (
              <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Click the camera icon to generate focused views from layout zones
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Zone Preview Confirmation Modal */}
        {previewZone && layoutImageUrl && (
          <ZonePreviewConfirm
            zone={previewZone}
            layoutImageUrl={layoutImageUrl}
            isGenerating={isGenerating}
            onConfirm={() => {
              onGenerateZoneView(previewZone, 'detail');
              setPreviewZone(null);
              onClose();
            }}
            onCancel={() => setPreviewZone(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
