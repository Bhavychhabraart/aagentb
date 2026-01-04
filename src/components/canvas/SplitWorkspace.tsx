import { useState, useEffect, useCallback } from 'react';
import { 
  Eye, Camera as CameraIcon, Plus, Lock, Unlock, Maximize2, Minimize2, Map, Sparkles,
  ZoomIn, ZoomOut, RotateCcw, Download, Crop, Undo2, Wand2, Video, LayoutGrid,
  Move, FileDown, ShoppingCart, Layers, RefreshCcw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CameraPlacement, CameraData } from './CameraPlacement';
import { CameraPropertiesPanel } from './CameraPropertiesPanel';
import { RenderHistoryCarousel, RenderHistoryItem } from './RenderHistoryCarousel';
import { SelectionOverlay, SelectionRegion } from './SelectionOverlay';
import { SelectiveEditPanel } from './SelectiveEditPanel';
import { AIDirectorPanel } from './AIDirectorPanel';
import { MulticamPanel, CameraView, ZoneRegion } from './MulticamPanel';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { ZoneSelector, Zone } from './ZoneSelector';
import { ZonesPanel } from './ZonesPanel';

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
  // Toolbar actions
  onSelectiveEdit?: (region: SelectionRegion, prompt: string, catalogItem?: CatalogFurnitureItem) => void;
  onAIDirectorChange?: (prompt: string) => void;
  onMulticamGenerate?: (view: CameraView, customPrompt?: string, zone?: ZoneRegion) => void;
  onPositionFurniture?: () => void;
  onExport?: () => void;
  onStartOrder?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isSelectiveEditing?: boolean;
  isMulticamGenerating?: boolean;
  multicamViews?: Record<CameraView, string | null>;
  onSetMulticamAsMain?: (imageUrl: string) => void;
  // Render history
  allRenders?: RenderHistoryItem[];
  currentRenderId?: string | null;
  onRenderHistorySelect?: (render: RenderHistoryItem) => void;
  stagedItems?: CatalogFurnitureItem[];
  projectId?: string;
  // Zone props
  zones?: Zone[];
  selectedZoneId?: string | null;
  isDrawingZone?: boolean;
  showZonesPanel?: boolean;
  onZoneCreate?: (zone: Omit<Zone, 'id'>) => void;
  onZoneDelete?: (zoneId: string) => void;
  onZoneSelect?: (zone: Zone | null) => void;
  onStartZoneDrawing?: () => void;
  onStopZoneDrawing?: () => void;
  onGenerateZoneView?: (zone: Zone) => void;
  onCompareZone?: (zone: Zone) => void;
  onToggleZonesPanel?: () => void;
  // Start Over and Upscale props
  onStartOver?: () => void;
  onUpscale?: () => void;
  isUpscaling?: boolean;
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
  onSelectiveEdit,
  onAIDirectorChange,
  onMulticamGenerate,
  onPositionFurniture,
  onExport,
  onStartOrder,
  onUndo,
  canUndo = false,
  isSelectiveEditing = false,
  isMulticamGenerating = false,
  multicamViews = { perspective: null, front: null, side: null, top: null, cinematic: null, custom: null },
  onSetMulticamAsMain,
  allRenders = [],
  currentRenderId,
  onRenderHistorySelect,
  stagedItems = [],
  projectId,
  // Zone props
  zones = [],
  selectedZoneId,
  isDrawingZone = false,
  showZonesPanel = false,
  onZoneCreate,
  onZoneDelete,
  onZoneSelect,
  onStartZoneDrawing,
  onStopZoneDrawing,
  onGenerateZoneView,
  onCompareZone,
  onToggleZonesPanel,
  // Start Over and Upscale props
  onStartOver,
  onUpscale,
  isUpscaling,
}: SplitWorkspaceProps) {
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<SelectionRegion | null>(null);
  const [showAIDirector, setShowAIDirector] = useState(false);
  const [showMulticam, setShowMulticam] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  const selectedCamera = cameras.find(c => c.id === selectedCameraId);

  // Handle 'A' key for fullscreen catalog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        onOpenFullCatalog?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenFullCatalog]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const handleDownload = async () => {
    if (birdEyeRenderUrl) {
      const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
      const link = document.createElement('a');
      link.href = birdEyeRenderUrl;
      link.download = formatDownloadFilename('render', 'birdseye', 'png');
      link.click();
    }
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setCurrentSelection(null);
    } else {
      setSelectionMode(true);
      setShowComparison(false);
    }
  };

  const handleSelectionComplete = (region: SelectionRegion | null) => {
    setCurrentSelection(region);
  };

  const handleSelectiveEditSubmit = (prompt: string, catalogItem?: CatalogFurnitureItem) => {
    if (currentSelection && onSelectiveEdit) {
      onSelectiveEdit(currentSelection, prompt, catalogItem);
    }
  };

  const handleSelectiveEditCancel = () => {
    setCurrentSelection(null);
    setSelectionMode(false);
  };

  const canSelectArea = !!birdEyeRenderUrl && !isGenerating && !showComparison && onSelectiveEdit;
  const canUseDirector = !!birdEyeRenderUrl && !isGenerating && !selectionMode && onAIDirectorChange;
  const canUseMulticam = !!birdEyeRenderUrl && !isGenerating && !selectionMode && onMulticamGenerate;
  const hasLayoutToCompare = !!layoutImageUrl && !!birdEyeRenderUrl;

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col bg-gradient-premium relative overflow-hidden">
        {/* Premium Header Bar with Full Toolbar */}
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

          {/* Center: Main Toolbar */}
          <div className="flex items-center gap-1 glass-premium rounded-xl px-2 py-1.5">
            {/* Selection Tool */}
            {onSelectiveEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={canSelectArea ? toggleSelectionMode : undefined}
                    disabled={!canSelectArea}
                    className={cn(
                      "h-8 w-8",
                      selectionMode ? "bg-amber-500/30 text-amber-400" : canSelectArea ? "hover:bg-primary/20" : "opacity-50"
                    )}
                  >
                    <Crop className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selectionMode ? 'Exit selection' : 'Select area to edit'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Comparison Toggle */}
            {hasLayoutToCompare && !selectionMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowComparison(!showComparison)}
                    className={cn(
                      "h-8 w-8",
                      showComparison ? "bg-primary/30 text-primary" : "hover:bg-primary/20"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showComparison ? 'Hide comparison' : 'Compare with layout'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Position Furniture */}
            {onPositionFurniture && !selectionMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPositionFurniture}
                    className="h-8 w-8 hover:bg-primary/20 text-primary"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Position furniture</p>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="w-px h-5 bg-border/30 mx-1" />

            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5 || !birdEyeRenderUrl || selectionMode}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono px-2 min-w-[3rem] text-center text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3 || !birdEyeRenderUrl || selectionMode}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              disabled={!birdEyeRenderUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-border/30 mx-1" />

            {/* Download */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!birdEyeRenderUrl}
                  className="h-8 w-8 hover:bg-primary/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download render</p>
              </TooltipContent>
            </Tooltip>

            {/* Upscale HD */}
            {onUpscale && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onUpscale}
                    disabled={!birdEyeRenderUrl || isUpscaling || isGenerating}
                    className={cn(
                      "h-8 w-8",
                      isUpscaling ? "text-primary" : "hover:bg-primary/20 text-primary"
                    )}
                  >
                    {isUpscaling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isUpscaling ? 'Upscaling...' : 'Upscale HD'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Start Order */}
            {onStartOrder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStartOrder}
                    className="h-8 w-8 hover:bg-primary/20 text-success"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start Order</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Export */}
            {onExport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onExport}
                    className="h-8 w-8 hover:bg-primary/20 text-primary"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export PPT / Invoice</p>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="w-px h-5 bg-border/30 mx-1" />

            {/* Undo */}
            {onUndo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={cn(
                      "h-8 w-8",
                      canUndo ? "hover:bg-primary/20 text-primary" : "text-muted-foreground/50"
                    )}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{canUndo ? 'Undo to previous' : 'No previous version'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* AI Director */}
            {onAIDirectorChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={canUseDirector ? () => setShowAIDirector(!showAIDirector) : undefined}
                    disabled={!canUseDirector}
                    className={cn(
                      "h-8 w-8",
                      showAIDirector ? "bg-primary/30 text-primary" : canUseDirector ? "hover:bg-primary/20 text-primary" : "opacity-50"
                    )}
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showAIDirector ? 'Close AI Director' : 'AI Director'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Multicam */}
            {onMulticamGenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={canUseMulticam ? () => setShowMulticam(!showMulticam) : undefined}
                    disabled={!canUseMulticam}
                    className={cn(
                      "h-8 w-8",
                      showMulticam ? "bg-cyan-500/30 text-cyan-400" : canUseMulticam ? "hover:bg-primary/20 text-cyan-400" : "opacity-50"
                    )}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showMulticam ? 'Close Multicam' : 'Multicam views'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Zones */}
            {onToggleZonesPanel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleZonesPanel}
                    disabled={!birdEyeRenderUrl || isGenerating}
                    className={cn(
                      "h-8 w-8",
                      showZonesPanel || isDrawingZone ? "bg-amber-500/30 text-amber-400" : birdEyeRenderUrl ? "hover:bg-primary/20 text-amber-400" : "opacity-50"
                    )}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showZonesPanel ? 'Close Zones' : 'Zones - Define areas for focused renders'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Start Over */}
            {onStartOver && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStartOver}
                    className="h-8 w-8 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start Over</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Right: Room Actions */}
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

            {!isRoomLocked ? (
              <>
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onCameraAdd}
                      className="btn-glow h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <CameraIcon className="h-3.5 w-3.5 mr-1.5" />
                      Camera
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Place camera for perspective renders</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border-warning/30 bg-warning/10">
                <Lock className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs font-medium text-warning">Locked</span>
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
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {birdEyeRenderUrl ? (
            <>
              {/* Bird's Eye Render */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div 
                  className="relative w-full h-full max-w-[90%] max-h-[85%] gradient-border gradient-border-subtle rounded-2xl overflow-hidden"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <img
                    src={birdEyeRenderUrl}
                    alt="Bird's Eye View"
                    className="w-full h-full object-contain bg-background"
                    draggable={false}
                  />
                  
                  {/* Camera Placement Overlay */}
                  {!isRoomLocked && !selectionMode && (
                    <CameraPlacement
                      cameras={cameras}
                      selectedCameraId={selectedCameraId}
                      onCameraSelect={onCameraSelect}
                      onCameraUpdate={onCameraUpdate}
                      onCameraDelete={onCameraDelete}
                      containerClassName="absolute inset-0"
                    />
                  )}

                  {/* Selection Overlay */}
                  {selectionMode && (
                    <SelectionOverlay
                      imageUrl={birdEyeRenderUrl}
                      onSelectionComplete={handleSelectionComplete}
                      isActive={selectionMode}
                    />
                  )}

                  {/* Zone Selector Overlay */}
                  {isDrawingZone && onZoneCreate && onZoneDelete && onZoneSelect && onStopZoneDrawing && (
                    <div className="absolute inset-0">
                      <ZoneSelector
                        imageUrl={birdEyeRenderUrl}
                        zones={zones}
                        onZoneCreate={onZoneCreate}
                        onZoneDelete={onZoneDelete}
                        onZoneSelect={onZoneSelect}
                        selectedZoneId={selectedZoneId || null}
                        isDrawing={isDrawingZone}
                        onDrawingChange={(drawing) => {
                          if (!drawing) onStopZoneDrawing();
                        }}
                      />
                    </div>
                  )}

                  {/* Zone Overlays when not drawing - now renders polygons */}
                  {!isDrawingZone && !selectionMode && zones.length > 0 && (
                    <svg className="absolute inset-0 pointer-events-none w-full h-full">
                      {zones.map((zone) => {
                        // Render as polygon if polygon_points exist, otherwise fallback to rect
                        if (zone.polygon_points && zone.polygon_points.length >= 3) {
                          const points = zone.polygon_points.map(p => `${p.x}%,${p.y}%`).join(' ');
                          return (
                            <g key={zone.id}>
                              <polygon
                                points={zone.polygon_points.map(p => `${p.x},${p.y}`).join(' ')}
                                className={cn(
                                  "transition-all",
                                  selectedZoneId === zone.id
                                    ? "fill-primary/10 stroke-primary"
                                    : "fill-amber-500/5 stroke-amber-500/50"
                                )}
                                strokeWidth="0.3"
                                style={{
                                  transform: 'scale(1)',
                                  transformOrigin: 'center',
                                }}
                                vectorEffect="non-scaling-stroke"
                              />
                              {/* Zone label */}
                              <foreignObject
                                x={`${zone.x_start}%`}
                                y={`${zone.y_start}%`}
                                width="100"
                                height="20"
                                className="overflow-visible"
                              >
                                <div className="px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium w-fit">
                                  {zone.name}
                                </div>
                              </foreignObject>
                            </g>
                          );
                        }
                        
                        // Fallback to rectangle for legacy zones
                        return (
                          <g key={zone.id}>
                            <rect
                              x={`${zone.x_start}%`}
                              y={`${zone.y_start}%`}
                              width={`${zone.x_end - zone.x_start}%`}
                              height={`${zone.y_end - zone.y_start}%`}
                              className={cn(
                                "transition-all",
                                selectedZoneId === zone.id
                                  ? "fill-primary/10 stroke-primary"
                                  : "fill-amber-500/5 stroke-amber-500/50"
                              )}
                              strokeWidth="2"
                            />
                            <foreignObject
                              x={`${zone.x_start}%`}
                              y={`${zone.y_start}%`}
                              width="100"
                              height="20"
                              className="overflow-visible"
                            >
                              <div className="px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium w-fit">
                                {zone.name}
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })}
                    </svg>
                  )}

                  {/* Locked overlay */}
                  {isRoomLocked && (
                    <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Camera count badge */}
              {cameras.length > 0 && !selectionMode && (
                <div className="absolute top-4 right-4 px-3 py-1.5 glass-premium rounded-full flex items-center gap-2 animate-fade-in">
                  <CameraIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-foreground">
                    {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Selective Edit Panel */}
              {selectionMode && currentSelection && birdEyeRenderUrl && (
                <SelectiveEditPanel
                  selection={currentSelection}
                  renderUrl={birdEyeRenderUrl}
                  onSubmit={handleSelectiveEditSubmit}
                  onCancel={handleSelectiveEditCancel}
                  isProcessing={isSelectiveEditing}
                />
              )}

              {/* AI Director Panel */}
              {showAIDirector && onAIDirectorChange && (
                <AIDirectorPanel
                  onApplyChange={onAIDirectorChange}
                  onClose={() => setShowAIDirector(false)}
                  isProcessing={isGenerating}
                />
              )}

              {/* Multicam Panel */}
              {showMulticam && onMulticamGenerate && (
                <MulticamPanel
                  onGenerateView={onMulticamGenerate}
                  onClose={() => setShowMulticam(false)}
                  isGenerating={isMulticamGenerating}
                  generatedViews={multicamViews}
                  onSelectView={(view, url) => onSetMulticamAsMain?.(url)}
                  projectId={projectId}
                />
              )}

              {/* Zones Panel */}
              {showZonesPanel && projectId && onZoneSelect && onToggleZonesPanel && onGenerateZoneView && (
                <ZonesPanel
                  projectId={projectId}
                  renderUrl={birdEyeRenderUrl}
                  layoutImageUrl={layoutImageUrl}
                  onZoneSelect={onZoneSelect}
                  selectedZoneId={selectedZoneId || null}
                  onEditZones={onToggleZonesPanel}
                  onGenerateZoneView={onGenerateZoneView}
                  onCompareZone={onCompareZone}
                  isGenerating={isMulticamGenerating}
                  onClose={onToggleZonesPanel}
                />
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

          {/* Floating Minimap - Clean glass styling */}
          {layoutImageUrl && (
            <div 
              className={cn(
                "absolute bottom-20 left-4 z-10 transition-all duration-300 ease-out rounded-xl overflow-hidden",
                "glass-premium border border-border/20",
                isMinimapExpanded ? "w-80 h-64" : "w-36 h-28"
              )}
            >
              {/* Minimap Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-1.5 bg-gradient-to-b from-background/80 to-transparent">
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
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => setIsMinimapExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {/* Render History Carousel */}
          {allRenders.length > 0 && onRenderHistorySelect && (
            <RenderHistoryCarousel
              renders={allRenders}
              currentRenderId={currentRenderId}
              onSelect={onRenderHistorySelect}
            />
          )}

          {/* Camera Properties Panel */}
          {selectedCamera && !isRoomLocked && !selectionMode && (
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
