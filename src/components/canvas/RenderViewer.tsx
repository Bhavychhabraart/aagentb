import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, X, Maximize2, LayoutGrid, Image, Move, FileDown, ShoppingCart, Crop, Undo2, Wand2, Camera, Video } from 'lucide-react';
import { MulticamPanel, CameraView, ZoneRegion } from './MulticamPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { SelectionOverlay, SelectionRegion } from './SelectionOverlay';
import { SelectiveEditPanel } from './SelectiveEditPanel';
import { AIDirectorPanel } from './AIDirectorPanel';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { RenderHistoryCarousel, RenderHistoryItem } from './RenderHistoryCarousel';

interface RenderViewerProps {
  imageUrl: string | null;
  isGenerating: boolean;
  layoutImageUrl?: string | null;
  roomPhotoUrl?: string | null;
  onClose?: () => void;
  onPositionFurniture?: () => void;
  onExport?: () => void;
  onStartOrder?: () => void;
  onSelectiveEdit?: (region: SelectionRegion, prompt: string, catalogItem?: CatalogFurnitureItem, referenceImageUrl?: string) => void;
  onAIDirectorChange?: (prompt: string) => void;
  onMulticamGenerate?: (view: CameraView, customPrompt?: string, zone?: ZoneRegion) => void;
  projectId?: string;
  isSelectiveEditing?: boolean;
  isMulticamGenerating?: boolean;
  multicamViews?: Record<CameraView, string | null>;
  onSetMulticamAsMain?: (imageUrl: string) => void;
  // Render history props
  allRenders?: RenderHistoryItem[];
  currentRenderId?: string | null;
  onRenderHistorySelect?: (render: RenderHistoryItem) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export function RenderViewer({ 
  imageUrl, 
  isGenerating, 
  layoutImageUrl,
  roomPhotoUrl,
  onClose, 
  onPositionFurniture, 
  onExport, 
  onStartOrder,
  onSelectiveEdit,
  onAIDirectorChange,
  onMulticamGenerate,
  projectId,
  isSelectiveEditing = false,
  isMulticamGenerating = false,
  multicamViews = { perspective: null, front: null, side: null, top: null, cinematic: null, custom: null },
  onSetMulticamAsMain,
  allRenders = [],
  currentRenderId,
  onRenderHistorySelect,
  onUndo,
  canUndo = false,
}: RenderViewerProps) {
  // Use room photo as fallback when no render is available (staging mode)
  const displayUrl = imageUrl || roomPhotoUrl;
  const isStagingMode = !imageUrl && !!roomPhotoUrl;
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<SelectionRegion | null>(null);
  const [showAIDirector, setShowAIDirector] = useState(false);
  const [showMulticam, setShowMulticam] = useState(false);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    if (imageUrl) {
      try {
        const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = formatDownloadFilename('render', 'project', 'png');
        link.click();
      } catch {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `agentb_render_${Date.now()}.png`;
        link.click();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1 && !selectionMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !selectionMode) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const toggleComparison = () => setShowComparison(!showComparison);

  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode
      setSelectionMode(false);
      setCurrentSelection(null);
    } else {
      // Entering selection mode
      setSelectionMode(true);
      setShowComparison(false); // Disable comparison when selecting
    }
  };

  const handleSelectionComplete = (region: SelectionRegion | null) => {
    setCurrentSelection(region);
  };

  const handleSelectiveEditSubmit = (prompt: string, catalogItem?: CatalogFurnitureItem, referenceImageUrl?: string) => {
    if (currentSelection && onSelectiveEdit) {
      onSelectiveEdit(currentSelection, prompt, catalogItem, referenceImageUrl);
      // Don't exit selection mode yet - let the parent handle that after processing
    }
  };

  const handleSelectiveEditCancel = () => {
    setCurrentSelection(null);
    setSelectionMode(false);
  };

  const hasLayoutToCompare = !!layoutImageUrl && !!imageUrl;
  const canSelectArea = !!imageUrl && !isGenerating && !showComparison && onSelectiveEdit;
  const canUseDirector = !!imageUrl && !isGenerating && !selectionMode && onAIDirectorChange;
  const canUseMulticam = !!imageUrl && !isGenerating && !selectionMode && onMulticamGenerate;

  const handleMulticamSelect = (view: CameraView, viewImageUrl: string) => {
    // When user clicks on a generated view, show it in the main viewer
    // This could be enhanced to swap the main image
    console.log('Selected view:', view, viewImageUrl);
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex-1 flex flex-col bg-background relative overflow-hidden",
        isFullscreen && "fixed inset-0 z-50"
      )}>
        {/* Cinematic letterbox bars */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[8%] bg-black/80 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black/80 backdrop-blur-sm" />
        </div>

        {/* Controls */}
        <div className="absolute top-[10%] right-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg border border-border/50 p-1">
            {/* Selection tool button */}
            {onSelectiveEdit && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={canSelectArea ? toggleSelectionMode : undefined}
                      disabled={!canSelectArea}
                      className={cn(
                        "h-8 w-8",
                        selectionMode ? "bg-amber-500/30 text-amber-400" : canSelectArea ? "hover:bg-primary/20" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!imageUrl ? 'Generate a render first to use selection tool' : selectionMode ? 'Exit selection mode' : 'Select area to edit'}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border/50 mx-1" />
              </>
            )}

            {/* Comparison toggle button */}
            {hasLayoutToCompare && !selectionMode && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleComparison}
                      className={cn(
                        "h-8 w-8",
                        showComparison ? "bg-primary/30 text-primary" : "hover:bg-primary/20"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showComparison ? 'Hide layout comparison' : 'Compare with layout'}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border/50 mx-1" />
              </>
            )}

            {/* Position furniture button */}
            {onPositionFurniture && !selectionMode && (
              <>
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
                    <p>Position furniture (100% accurate)</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border/50 mx-1" />
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5 || !imageUrl || selectionMode}
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
              disabled={zoom >= 3 || !imageUrl || selectionMode}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              disabled={!imageUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={!imageUrl}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onStartOrder && (
              <>
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
                <div className="w-px h-4 bg-border/50 mx-1" />
              </>
            )}
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
            {/* Undo button */}
            {onUndo && (
              <>
                <div className="w-px h-4 bg-border/50 mx-1" />
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
                    <p>{canUndo ? 'Undo to previous version' : 'No previous version'}</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {/* AI Director button */}
            {onAIDirectorChange && (
              <>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={canUseDirector ? () => setShowAIDirector(!showAIDirector) : undefined}
                      disabled={!canUseDirector}
                      className={cn(
                        "h-8 w-8",
                        showAIDirector ? "bg-primary/30 text-primary" : canUseDirector ? "hover:bg-primary/20 text-primary" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!imageUrl ? 'Generate a render first to use AI Director' : showAIDirector ? 'Close AI Director' : 'AI Director - Quick global changes'}</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {/* Multicam button */}
            {onMulticamGenerate && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={canUseMulticam ? () => setShowMulticam(!showMulticam) : undefined}
                      disabled={!canUseMulticam}
                      className={cn(
                        "h-8 w-8",
                        showMulticam ? "bg-cyan-500/30 text-cyan-400" : canUseMulticam ? "hover:bg-primary/20 text-cyan-400" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!imageUrl ? 'Generate a render first to use Multicam' : showMulticam ? 'Close Multicam' : 'Multicam - Generate different views'}</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          {(onClose || isFullscreen) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isFullscreen ? toggleFullscreen : onClose}
              className="h-8 w-8 bg-black/70 backdrop-blur-md border border-border/50 hover:bg-primary/20"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Canvas Area with 16:9 aspect ratio */}
        <div className="flex-1 flex items-center justify-center p-8">
          {showComparison && hasLayoutToCompare ? (
            // Side-by-side comparison view
            <div className="flex gap-4 w-full max-w-6xl h-full max-h-[80vh]">
              {/* Layout reference */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    2D Layout Reference
                  </span>
                </div>
                <div 
                  className={cn(
                    'relative flex-1 rounded-lg overflow-hidden',
                    'bg-black/40 border border-primary/30',
                    'shadow-lg'
                  )}
                >
                  <img
                    src={layoutImageUrl}
                    alt="Layout Reference"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* Corner label */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded text-xs font-mono text-primary border border-primary/30">
                    LAYOUT
                  </div>
                </div>
              </div>

              {/* Generated render */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Image className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Generated Render
                  </span>
                </div>
                <div 
                  className={cn(
                    'relative flex-1 rounded-lg overflow-hidden',
                    'bg-black/40 border border-border/30',
                    'shadow-lg'
                  )}
                >
                  {/* Subtle vignette effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-10" />
                  
                  <img
                    src={imageUrl}
                    alt="Generated Render"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* Corner label */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-mono text-foreground border border-border/30">
                    RENDER
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Standard single view
            <div 
              className={cn(
                'relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden',
                'bg-black/40 border border-border/30',
                'shadow-2xl shadow-black/50',
                !selectionMode && isDragging && 'cursor-grabbing',
                !selectionMode && zoom > 1 && !isDragging && 'cursor-grab',
                selectionMode && 'cursor-crosshair'
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Subtle vignette effect */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-10" />
              
              {isGenerating || isSelectiveEditing ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Cinematic loading skeleton */}
                  <div className="absolute inset-4 rounded bg-muted/20 animate-pulse" />
                  <div className="absolute inset-4 bg-shimmer bg-[length:200%_100%] animate-shimmer rounded opacity-50" />
                  
                  {/* Center loading indicator */}
                  <div className="relative z-20 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono tracking-wider uppercase">
                      {isSelectiveEditing ? 'Applying selective edit...' : 'Generating render...'}
                    </p>
                  </div>
                </div>
              ) : displayUrl ? (
                <>
                  <img
                    src={displayUrl}
                    alt={isStagingMode ? "Room Photo - Staging" : "Render"}
                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-200 select-none"
                    style={{
                      transform: selectionMode ? 'none' : `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    }}
                    draggable={false}
                  />
                  
                  {/* Staging mode indicator */}
                  {isStagingMode && (
                    <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-500/30">
                      <span className="text-xs font-medium text-amber-400">Staging Mode — Browse catalog to add furniture</span>
                    </div>
                  )}
                  
                  {/* Selection overlay */}
                  {selectionMode && imageUrl && (
                    <SelectionOverlay
                      imageUrl={imageUrl}
                      isActive={selectionMode && !currentSelection}
                      onSelectionComplete={handleSelectionComplete}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-md px-8">
                    {/* Animated placeholder */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
                      <div className="absolute inset-2 rounded-full bg-gradient-brand flex items-center justify-center glow-subtle">
                        <div className="w-8 h-8 rounded-full bg-primary/30" />
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-foreground mb-3">Ready to design</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Upload a room image or describe what you want to create. 
                      Your cinematic 16:9 render will appear here.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-4">
                      Editing tools like Selection, AI Director, and Multicam will be available once a render is generated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selective edit panel */}
        {currentSelection && selectionMode && !isSelectiveEditing && displayUrl && (
          <SelectiveEditPanel
            selection={currentSelection}
            renderUrl={displayUrl}
            onSubmit={handleSelectiveEditSubmit}
            onCancel={handleSelectiveEditCancel}
            isProcessing={isSelectiveEditing}
          />
        )}

        {/* Selection mode indicator */}
        {selectionMode && !currentSelection && (
          <div className="absolute top-[10%] left-4 z-20">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 backdrop-blur-md rounded-lg border border-amber-500/30">
              <Crop className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Selection Mode</span>
            </div>
          </div>
        )}

        {/* AI Director Panel */}
        {showAIDirector && onAIDirectorChange && !selectionMode && (
          <AIDirectorPanel
            onApplyChange={(prompt) => {
              onAIDirectorChange(prompt);
              setShowAIDirector(false);
            }}
            onClose={() => setShowAIDirector(false)}
            isProcessing={isSelectiveEditing || isGenerating}
          />
        )}

        {/* Multicam Panel */}
        {showMulticam && canUseMulticam && (
          <MulticamPanel
            onGenerateView={onMulticamGenerate!}
            isGenerating={isMulticamGenerating}
            generatedViews={multicamViews}
            onSelectView={handleMulticamSelect}
            onClose={() => setShowMulticam(false)}
            onSetAsMain={onSetMulticamAsMain}
            projectId={projectId}
          />
        )}

        {/* Render History Carousel */}
        {allRenders.length > 1 && onRenderHistorySelect && !showComparison && !selectionMode && !isSelectiveEditing && !showAIDirector && !showMulticam && (
          <RenderHistoryCarousel
            renders={allRenders}
            currentRenderId={currentRenderId || null}
            onSelect={onRenderHistorySelect}
          />
        )}

        {/* Bottom info bar */}
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 z-20",
          allRenders.length > 1 && onRenderHistorySelect && !showComparison && !selectionMode && !isSelectiveEditing
            ? "bottom-[22%]"
            : "bottom-[10%]"
        )}>
          <div className="flex items-center gap-4 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-border/30">
            <span className="text-xs font-mono text-muted-foreground">16:9</span>
            <div className="w-px h-3 bg-border/50" />
            <span className="text-xs font-mono text-muted-foreground">1920×1080</span>
            {showComparison && (
              <>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-xs font-mono text-primary">Comparing</span>
              </>
            )}
            {selectionMode && (
              <>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-xs font-mono text-amber-400">Selecting</span>
              </>
            )}
            {!showComparison && !selectionMode && imageUrl && (
              <>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-xs font-mono text-primary">Ready</span>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
