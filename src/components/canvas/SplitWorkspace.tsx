import { useState, useEffect, useCallback } from 'react';
import { Eye, Camera as CameraIcon, Plus, Lock, Unlock, Maximize2, Minimize2, Map, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CameraPlacement, CameraData } from './CameraPlacement';
import { CameraPropertiesPanel } from './CameraPropertiesPanel';

interface SplitWorkspaceProps {
  layoutImageUrl: string | null;
  birdEyeRenderUrl: string | null;
  isGenerating: boolean;
  cameras: CameraData[];
  selectedCameraId: string | null;
  isRoomLocked: boolean;
  onCameraAdd: () => void;
  onCameraSelect: (cameraId: string | null) => void;
  onCameraUpdate: (camera: CameraData) => void;
  onCameraDelete: (cameraId: string) => void;
  onGenerateFromCamera: (cameraId: string, prompt: string) => void;
  onToggleRoomLock: () => void;
  onOpenFullCatalog?: () => void;
}

export function SplitWorkspace({
  layoutImageUrl,
  birdEyeRenderUrl,
  isGenerating,
  cameras,
  selectedCameraId,
  isRoomLocked,
  onCameraAdd,
  onCameraSelect,
  onCameraUpdate,
  onCameraDelete,
  onGenerateFromCamera,
  onToggleRoomLock,
  onOpenFullCatalog,
}: SplitWorkspaceProps) {
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
  const selectedCamera = cameras.find(c => c.id === selectedCameraId);

  // Handle 'A' key for fullscreen catalog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        onOpenFullCatalog?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenFullCatalog]);

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col bg-gradient-premium relative overflow-hidden">
        {/* Premium Header Bar */}
        <div className="workspace-header relative z-20 flex items-center justify-between px-4 py-3">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center shadow-glow">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bird's Eye View</p>
              </div>
            </div>
            
            {isGenerating && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass animate-glow-pulse">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-medium text-cyan-400">Generating...</span>
              </div>
            )}
          </div>

          {/* Center: Lock Status */}
          {isRoomLocked && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full glass border-warning/30 bg-warning/10">
              <Lock className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-medium text-warning">Room Locked</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleRoomLock}
                className="h-6 px-2 text-xs text-warning hover:bg-warning/20"
              >
                <Unlock className="h-3 w-3 mr-1" />
                Unlock
              </Button>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Keyboard hint for catalog */}
            {onOpenFullCatalog && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onOpenFullCatalog}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass hover:border-primary/40 transition-all hover-glow"
                  >
                    <span className="kbd">A</span>
                    <span className="text-xs text-muted-foreground">Catalog</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Press A for fullscreen catalog</p>
                </TooltipContent>
              </Tooltip>
            )}

            {!isRoomLocked && (
              <>
                {/* Lock Room Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleRoomLock}
                      className="btn-glass h-8 text-xs hover:border-warning/40 hover:text-warning"
                    >
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      Lock
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lock room when design is finalized</p>
                  </TooltipContent>
                </Tooltip>

                {/* Add Camera Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onCameraAdd}
                      className="btn-glow h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <CameraIcon className="h-3.5 w-3.5 mr-1.5" />
                      Add Camera
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Place camera for perspective renders</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {birdEyeRenderUrl ? (
            <>
              {/* Bird's Eye Render - Full Screen */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="relative w-full h-full max-w-[90%] max-h-[90%] gradient-border gradient-border-subtle rounded-2xl overflow-hidden">
                  <img
                    src={birdEyeRenderUrl}
                    alt="Bird's Eye View"
                    className="w-full h-full object-contain bg-background"
                    draggable={false}
                  />
                  
                  {/* Camera Placement Overlay */}
                  {!isRoomLocked && (
                    <CameraPlacement
                      cameras={cameras}
                      selectedCameraId={selectedCameraId}
                      onCameraSelect={onCameraSelect}
                      onCameraUpdate={onCameraUpdate}
                      onCameraDelete={onCameraDelete}
                      containerClassName="absolute inset-0"
                    />
                  )}

                  {/* Locked overlay with subtle pattern */}
                  {isRoomLocked && (
                    <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Camera count badge */}
              {cameras.length > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 glass-premium rounded-full flex items-center gap-2 animate-fade-in">
                  <CameraIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-foreground">
                    {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center p-8">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-primary/20 flex items-center justify-center animate-float">
                  <Eye className="h-12 w-12 text-cyan-400/60" />
                </div>
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/10 to-primary/10 -z-10 blur-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Bird's Eye View Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload a room photo or describe your space to generate a stunning top-down view for staging
                </p>
              </div>
              {isGenerating && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-full glass animate-glow-pulse">
                  <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-medium text-cyan-400">Creating your view...</span>
                </div>
              )}
            </div>
          )}

          {/* Floating Minimap */}
          {layoutImageUrl && (
            <div 
              className={cn(
                "absolute bottom-4 left-4 z-10 minimap-container transition-all duration-300 ease-out",
                isMinimapExpanded ? "w-80 h-64" : "w-40 h-32"
              )}
            >
              {/* Minimap Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-1.5 bg-gradient-to-b from-background/90 to-transparent">
                <div className="flex items-center gap-1.5">
                  <Map className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Layout</span>
                </div>
                <button
                  onClick={() => setIsMinimapExpanded(!isMinimapExpanded)}
                  className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  {isMinimapExpanded ? (
                    <Minimize2 className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
              
              {/* Minimap Image */}
              <img
                src={layoutImageUrl}
                alt="2D Layout"
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Hover expand hint */}
              {!isMinimapExpanded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => setIsMinimapExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {/* Camera Properties Panel (slides in when camera is selected) */}
          {selectedCamera && !isRoomLocked && (
            <CameraPropertiesPanel
              camera={selectedCamera}
              onUpdate={onCameraUpdate}
              onDelete={() => {
                onCameraDelete(selectedCamera.id);
                onCameraSelect(null);
              }}
              onGenerate={(prompt) => onGenerateFromCamera(selectedCamera.id, prompt)}
              onClose={() => onCameraSelect(null)}
              isGenerating={isGenerating}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
