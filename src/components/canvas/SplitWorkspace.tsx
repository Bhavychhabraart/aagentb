import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { LayoutGrid, Eye, Maximize2, Minimize2, Camera as CameraIcon, Plus, Lock, Unlock, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CameraPlacement, CameraData } from './CameraPlacement';
import { CameraPropertiesPanel } from './CameraPropertiesPanel';
import { FurnitureOverlay, StagedFurnitureItem } from './FurnitureOverlay';

interface SplitWorkspaceProps {
  layoutImageUrl: string | null;
  birdEyeRenderUrl: string | null;
  isGenerating: boolean;
  cameras: CameraData[];
  selectedCameraId: string | null;
  isRoomLocked: boolean;
  stagedFurniture: StagedFurnitureItem[];
  selectedFurnitureId: string | null;
  onCameraAdd: () => void;
  onCameraSelect: (cameraId: string | null) => void;
  onCameraUpdate: (camera: CameraData) => void;
  onCameraDelete: (cameraId: string) => void;
  onGenerateFromCamera: (cameraId: string, prompt: string) => void;
  onToggleRoomLock: () => void;
  onFurnitureClick: (furniture: StagedFurnitureItem) => void;
}

export function SplitWorkspace({
  layoutImageUrl,
  birdEyeRenderUrl,
  isGenerating,
  cameras,
  selectedCameraId,
  isRoomLocked,
  stagedFurniture,
  selectedFurnitureId,
  onCameraAdd,
  onCameraSelect,
  onCameraUpdate,
  onCameraDelete,
  onGenerateFromCamera,
  onToggleRoomLock,
  onFurnitureClick,
}: SplitWorkspaceProps) {
  const [isLayoutExpanded, setIsLayoutExpanded] = useState(false);
  const selectedCamera = cameras.find(c => c.id === selectedCameraId);

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {/* Room Lock Status Banner */}
        {isRoomLocked && (
          <div className="absolute top-0 left-0 right-0 z-30 bg-warning/20 border-b border-warning/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning text-sm">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Room Locked</span>
              <span className="text-warning/80">— Viewing mode only</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleRoomLock}
              className="h-7 text-xs border-warning/50 text-warning hover:bg-warning/10"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Unlock
            </Button>
          </div>
        )}

        <ResizablePanelGroup direction="horizontal" className={cn("flex-1", isRoomLocked && "mt-10")}>
          {/* Left Panel: 2D Layout */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <div className="h-full flex flex-col bg-muted/30 border-r border-border">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-background/50">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    2D Layout
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsLayoutExpanded(!isLayoutExpanded)}
                    >
                      {isLayoutExpanded ? (
                        <Minimize2 className="h-3 w-3" />
                      ) : (
                        <Maximize2 className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLayoutExpanded ? 'Collapse' : 'Expand'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Layout Image with Furniture Overlay */}
              <div className="flex-1 p-3 flex items-center justify-center overflow-hidden">
                {layoutImageUrl ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden border border-border/50 bg-black/20">
                    <img
                      src={layoutImageUrl}
                      alt="2D Layout"
                      className="absolute inset-0 w-full h-full object-contain"
                      draggable={false}
                    />
                    
                    {/* Furniture Overlay - clickable zones */}
                    <FurnitureOverlay
                      stagedFurniture={stagedFurniture}
                      onFurnitureClick={onFurnitureClick}
                      selectedFurnitureId={selectedFurnitureId}
                      disabled={isRoomLocked}
                    />
                    
                    {/* Corner label */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded text-xs font-mono text-primary border border-primary/30 z-20">
                      LAYOUT
                    </div>
                    
                    {/* Furniture count badge */}
                    {stagedFurniture.length > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1.5 z-20">
                        <MousePointer className="h-3 w-3" />
                        {stagedFurniture.length} item{stagedFurniture.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center">
                      <LayoutGrid className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">No layout uploaded</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Upload a 2D floor plan to see it here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: Bird's Eye View with Camera Placement */}
          <ResizablePanel defaultSize={70}>
            <div className="h-full flex flex-col relative">
              {/* Header with Camera Controls */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-background/50">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bird's Eye View
                  </span>
                  {isGenerating && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-xs text-cyan-400">Generating...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Lock Room Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleRoomLock}
                        disabled={isRoomLocked}
                        className={cn(
                          "h-7 text-xs",
                          isRoomLocked ? "opacity-50" : "hover:bg-warning/10 hover:text-warning"
                        )}
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        Lock Room
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lock room when finished to prevent changes</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Add Camera Button */}
                  {!isRoomLocked && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onCameraAdd}
                          className="h-7 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <CameraIcon className="h-3 w-3" />
                          Add Camera
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Place a camera to generate perspective views</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 relative overflow-hidden">
                {birdEyeRenderUrl ? (
                  <div className="absolute inset-0">
                    {/* Bird's Eye Render */}
                    <img
                      src={birdEyeRenderUrl}
                      alt="Bird's Eye View"
                      className="absolute inset-0 w-full h-full object-contain"
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

                    {/* Locked overlay */}
                    {isRoomLocked && (
                      <div className="absolute inset-0 bg-background/10 pointer-events-none" />
                    )}

                    {/* Corner label */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-cyan-500/20 backdrop-blur-sm rounded text-xs font-mono text-cyan-400 border border-cyan-500/30">
                      BIRD'S EYE
                    </div>

                    {/* Camera count badge */}
                    {cameras.length > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1.5">
                        <CameraIcon className="h-3 w-3" />
                        {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6 bg-gradient-to-br from-background to-muted/30">
                    <div className="h-20 w-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Eye className="h-10 w-10 text-cyan-400/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground">No Bird's Eye View Yet</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Upload a room photo or describe your room to generate a top-down bird's eye view for staging
                      </p>
                    </div>
                    {isGenerating && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-sm text-cyan-400">Generating view...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
