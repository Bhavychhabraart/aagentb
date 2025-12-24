import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, 
  Grid3X3, 
  LayoutGrid, 
  X, 
  Maximize2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CameraData {
  id: string;
  name: string;
  x_position: number;
  y_position: number;
  rotation: number;
  fov_angle: number;
}

interface RenderItem {
  id: string;
  render_url: string;
  prompt: string;
  created_at: string;
  camera_id?: string;
}

interface CameraRendersGalleryProps {
  cameras: CameraData[];
  renders: RenderItem[];
  onSelectRender: (render: RenderItem) => void;
  onClose: () => void;
}

export function CameraRendersGallery({
  cameras,
  renders,
  onSelectRender,
  onClose,
}: CameraRendersGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [lightboxRender, setLightboxRender] = useState<RenderItem | null>(null);

  // Group renders by camera
  const rendersByCamera = cameras.reduce((acc, camera) => {
    acc[camera.id] = renders.filter(r => r.camera_id === camera.id);
    return acc;
  }, {} as Record<string, RenderItem[]>);

  // Renders without a camera (general renders)
  const unassignedRenders = renders.filter(r => !r.camera_id);

  const filteredRenders = selectedCameraId 
    ? rendersByCamera[selectedCameraId] || []
    : renders;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Camera Renders Gallery</h2>
            <span className="text-sm text-muted-foreground">
              {renders.length} render{renders.length !== 1 ? 's' : ''} • {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Compare
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Camera Sidebar */}
          <div className="w-64 border-r border-border bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Filter by Camera
                </h3>
                
                <Button
                  variant={selectedCameraId === null ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCameraId(null)}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  All Renders
                  <span className="ml-auto text-xs text-muted-foreground">
                    {renders.length}
                  </span>
                </Button>
                
                {cameras.map((camera) => (
                  <Button
                    key={camera.id}
                    variant={selectedCameraId === camera.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCameraId(camera.id)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {camera.name}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {rendersByCamera[camera.id]?.length || 0}
                    </span>
                  </Button>
                ))}
                
                {unassignedRenders.length > 0 && (
                  <Button
                    variant={selectedCameraId === 'unassigned' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCameraId('unassigned')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    General Renders
                    <span className="ml-auto text-xs text-muted-foreground">
                      {unassignedRenders.length}
                    </span>
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {viewMode === 'grid' ? (
                  <GridView 
                    renders={filteredRenders}
                    onSelect={onSelectRender}
                    onLightbox={setLightboxRender}
                  />
                ) : (
                  <ComparisonView 
                    cameras={cameras}
                    rendersByCamera={rendersByCamera}
                    onSelect={onSelectRender}
                    onLightbox={setLightboxRender}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxRender} onOpenChange={() => setLightboxRender(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {lightboxRender && format(new Date(lightboxRender.created_at), 'PPpp')}
            </DialogTitle>
          </DialogHeader>
          {lightboxRender && (
            <div className="space-y-4">
              <img
                src={lightboxRender.render_url}
                alt="Render"
                className="w-full rounded-lg"
              />
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Prompt:</span> {lightboxRender.prompt}
                </p>
              </div>
              <Button 
                onClick={() => {
                  onSelectRender(lightboxRender);
                  setLightboxRender(null);
                  onClose();
                }}
                className="w-full"
              >
                Use This Render
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Grid View Component
function GridView({ 
  renders, 
  onSelect,
  onLightbox 
}: { 
  renders: RenderItem[]; 
  onSelect: (r: RenderItem) => void;
  onLightbox: (r: RenderItem) => void;
}) {
  if (renders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Camera className="h-12 w-12 mb-4 opacity-50" />
        <p>No renders found</p>
        <p className="text-sm">Generate renders from camera positions to see them here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {renders.map((render) => (
        <RenderCard
          key={render.id}
          render={render}
          onSelect={onSelect}
          onLightbox={onLightbox}
        />
      ))}
    </div>
  );
}

// Comparison View Component - Side by side by camera
function ComparisonView({ 
  cameras, 
  rendersByCamera,
  onSelect,
  onLightbox 
}: { 
  cameras: CameraData[];
  rendersByCamera: Record<string, RenderItem[]>;
  onSelect: (r: RenderItem) => void;
  onLightbox: (r: RenderItem) => void;
}) {
  const camerasWithRenders = cameras.filter(c => (rendersByCamera[c.id]?.length || 0) > 0);

  if (camerasWithRenders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Grid3X3 className="h-12 w-12 mb-4 opacity-50" />
        <p>No camera renders to compare</p>
        <p className="text-sm">Place cameras and generate renders to compare views</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {camerasWithRenders.map((camera) => (
        <div key={camera.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{camera.name}</h3>
            <span className="text-xs text-muted-foreground">
              ({rendersByCamera[camera.id]?.length || 0} renders)
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rendersByCamera[camera.id]?.map((render) => (
              <RenderCard
                key={render.id}
                render={render}
                onSelect={onSelect}
                onLightbox={onLightbox}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Individual Render Card
function RenderCard({ 
  render, 
  onSelect,
  onLightbox 
}: { 
  render: RenderItem; 
  onSelect: (r: RenderItem) => void;
  onLightbox: (r: RenderItem) => void;
}) {
  return (
    <div
      className={cn(
        'group relative aspect-video rounded-lg overflow-hidden',
        'border border-border bg-muted/50',
        'hover:border-primary/50 transition-all duration-200',
        'cursor-pointer'
      )}
      onClick={() => onSelect(render)}
    >
      <img
        src={render.render_url}
        alt="Render"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLightbox(render);
            }}
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>
      
      {/* Bottom info bar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/80 truncate max-w-[70%]">
            {render.prompt.slice(0, 40)}...
          </span>
          <span className="text-[10px] font-mono text-white/60">
            {format(new Date(render.created_at), 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
}
