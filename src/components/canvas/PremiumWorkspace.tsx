import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  MousePointer2, 
  Wand2, 
  Video, 
  Layers, 
  Move, 
  Undo2, 
  FileDown,
  Loader2,
  ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Camera,
  X,
  Check,
  Square,
  Eye,
  Film,
  User,
  ArrowUp,
  Clapperboard,
  // New icons for enhanced tools
  SquareStack,
  Eraser,
  ScanSearch,
  Package,
  ShoppingCart,
  GripVertical
} from 'lucide-react';
import { RenderHistoryCarousel, RenderHistoryItem } from './RenderHistoryCarousel';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { CameraView } from './MulticamPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export type ViewType = 'detail' | 'cinematic' | 'eye-level' | 'dramatic' | 'bird-eye';

export interface ViewTypeOption {
  id: ViewType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

export const viewTypeOptions: ViewTypeOption[] = [
  { id: 'detail', icon: Eye, label: 'Detail', description: 'Close-up detailed view' },
  { id: 'cinematic', icon: Film, label: 'Cinematic', description: 'Dramatic wide-angle shot' },
  { id: 'eye-level', icon: User, label: 'Eye Level', description: 'Natural standing perspective' },
  { id: 'dramatic', icon: Clapperboard, label: 'Dramatic', description: 'Low-angle hero shot' },
  { id: 'bird-eye', icon: ArrowUp, label: 'Bird Eye', description: 'Elevated overview' },
];

export interface Zone {
  id: string;
  name: string;
  x_start: number;
  y_start: number;
  x_end: number;
  y_end: number;
}

interface PremiumWorkspaceProps {
  renderUrl: string | null;
  isGenerating: boolean;
  allRenders: RenderHistoryItem[];
  currentRenderId: string | null;
  onRenderHistorySelect: (render: RenderHistoryItem) => void;
  // Toolbar actions
  onSelectiveEdit?: () => void;
  onAIDirectorChange?: (directive: string) => void;
  onMulticamGenerate?: () => void;
  onPositionFurniture?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isSelectiveEditing?: boolean;
  isMulticamGenerating?: boolean;
  multicamViews?: Record<CameraView, string | null>;
  onSetMulticamAsMain?: (view: CameraView) => void;
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
  onGenerateZoneView?: (zone: Zone, viewType: ViewType) => void;
  onToggleZonesPanel?: () => void;
  // Zone generation state
  generatingZoneName?: string | null;
  generatingViewType?: ViewType | null;
  // New enhanced tools
  onToggleMultiSelect?: () => void;
  isMultiSelectMode?: boolean;
  onToggleAIDetection?: () => void;
  isAIDetectionActive?: boolean;
  onToggleEraser?: () => void;
  isEraserMode?: boolean;
  onToggleAutoFurnish?: () => void;
  showAutoFurnish?: boolean;
  onToggleAssetsPanel?: () => void;
  showAssetsPanel?: boolean;
  onOpenCatalogue?: () => void;
  // Selection tool props
  isSelectionMode?: boolean;
  onSelectionComplete?: (region: { x: number; y: number; width: number; height: number } | null) => void;
}

interface ToolbarItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  shortcut?: string;
  group?: string;
}

export function PremiumWorkspace({
  renderUrl,
  isGenerating,
  allRenders,
  currentRenderId,
  onRenderHistorySelect,
  onSelectiveEdit,
  onAIDirectorChange,
  onMulticamGenerate,
  onPositionFurniture,
  onExport,
  onUndo,
  canUndo,
  isSelectiveEditing,
  isMulticamGenerating,
  zones = [],
  selectedZoneId,
  isDrawingZone,
  showZonesPanel,
  onZoneCreate,
  onZoneDelete,
  onZoneSelect,
  onStartZoneDrawing,
  onStopZoneDrawing,
  onGenerateZoneView,
  onToggleZonesPanel,
  generatingZoneName,
  generatingViewType,
  // New enhanced tools
  onToggleMultiSelect,
  isMultiSelectMode,
  onToggleAIDetection,
  isAIDetectionActive,
  onToggleEraser,
  isEraserMode,
  onToggleAutoFurnish,
  showAutoFurnish,
  onToggleAssetsPanel,
  showAssetsPanel,
  onOpenCatalogue,
  stagedItems,
  // Selection tool props
  isSelectionMode,
  onSelectionComplete,
}: PremiumWorkspaceProps) {
  const [showDirectorInput, setShowDirectorInput] = useState(false);
  const [directorPrompt, setDirectorPrompt] = useState('');
  
  // Zone drawing state
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [pendingZone, setPendingZone] = useState<Omit<Zone, 'id' | 'name'> | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  
  // Selection tool state (internal)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);

  const handleDirectorSubmit = () => {
    if (directorPrompt.trim() && onAIDirectorChange) {
      onAIDirectorChange(directorPrompt);
      setDirectorPrompt('');
      setShowDirectorInput(false);
    }
  };

  // Zone drawing handlers
  const getPercentageCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawingZone) return;
    e.preventDefault();
    const coords = getPercentageCoords(e.clientX, e.clientY);
    setDrawStart(coords);
    setDrawCurrent(coords);
  }, [isDrawingZone, getPercentageCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingZone || !drawStart) return;
    const coords = getPercentageCoords(e.clientX, e.clientY);
    setDrawCurrent(coords);
  }, [isDrawingZone, drawStart, getPercentageCoords]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawingZone || !drawStart || !drawCurrent) return;
    
    const x_start = Math.min(drawStart.x, drawCurrent.x);
    const y_start = Math.min(drawStart.y, drawCurrent.y);
    const x_end = Math.max(drawStart.x, drawCurrent.x);
    const y_end = Math.max(drawStart.y, drawCurrent.y);
    
    if (x_end - x_start > 5 && y_end - y_start > 5) {
      setPendingZone({ x_start, y_start, x_end, y_end });
      setShowNameInput(true);
      setNewZoneName(`Zone ${zones.length + 1}`);
    }
    
    setDrawStart(null);
    setDrawCurrent(null);
    onStopZoneDrawing?.();
  }, [isDrawingZone, drawStart, drawCurrent, zones.length, onStopZoneDrawing]);

  const handleConfirmZone = () => {
    if (pendingZone && newZoneName.trim() && onZoneCreate) {
      onZoneCreate({ ...pendingZone, name: newZoneName.trim() });
      setPendingZone(null);
      setShowNameInput(false);
      setNewZoneName('');
    }
  };

  const handleCancelZone = () => {
    setPendingZone(null);
    setShowNameInput(false);
    setNewZoneName('');
  };

  const currentRect = drawStart && drawCurrent ? {
    left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
    top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
    width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
    height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
  } : null;

  // Tool groups
  const selectionTools: ToolbarItem[] = [
    {
      id: 'select',
      icon: MousePointer2,
      label: 'Select',
      onClick: onSelectiveEdit,
      disabled: !renderUrl || isGenerating,
      active: isSelectiveEditing,
      shortcut: 'S',
      group: 'selection',
    },
    {
      id: 'multiselect',
      icon: SquareStack,
      label: 'Multi',
      onClick: onToggleMultiSelect,
      disabled: !renderUrl || isGenerating,
      active: isMultiSelectMode,
      shortcut: 'M',
      group: 'selection',
    },
  ];

  const editingTools: ToolbarItem[] = [
    {
      id: 'eraser',
      icon: Eraser,
      label: 'Erase',
      onClick: onToggleEraser,
      disabled: !renderUrl || isGenerating,
      active: isEraserMode,
      shortcut: 'E',
      group: 'editing',
    },
    {
      id: 'director',
      icon: Wand2,
      label: 'Director',
      onClick: () => setShowDirectorInput(!showDirectorInput),
      disabled: !renderUrl || isGenerating,
      active: showDirectorInput,
      shortcut: 'D',
      group: 'editing',
    },
  ];

  const aiTools: ToolbarItem[] = [
    {
      id: 'detect',
      icon: ScanSearch,
      label: 'Detect',
      onClick: onToggleAIDetection,
      disabled: !renderUrl || isGenerating,
      active: isAIDetectionActive,
      shortcut: 'F',
      group: 'ai',
    },
    {
      id: 'autofurnish',
      icon: Sparkles,
      label: 'Furnish',
      onClick: onToggleAutoFurnish,
      disabled: !renderUrl || isGenerating,
      active: showAutoFurnish,
      shortcut: 'A',
      group: 'ai',
    },
  ];

  const viewTools: ToolbarItem[] = [
    {
      id: 'views',
      icon: Video,
      label: 'Views',
      onClick: onMulticamGenerate,
      disabled: !renderUrl || isGenerating,
      active: isMulticamGenerating,
      shortcut: 'V',
      group: 'view',
    },
    {
      id: 'zones',
      icon: Layers,
      label: 'Zones',
      onClick: onToggleZonesPanel,
      disabled: !renderUrl,
      active: showZonesPanel,
      shortcut: 'Z',
      group: 'view',
    },
  ];

  const stagedItemsCount = stagedItems?.length || 0;

  const placementTools: ToolbarItem[] = [
    {
      id: 'position',
      icon: Move,
      label: stagedItemsCount > 0 ? `Position (${stagedItemsCount})` : 'Position',
      onClick: onPositionFurniture,
      disabled: !onPositionFurniture || stagedItemsCount === 0,
      active: stagedItemsCount > 0,
      shortcut: 'P',
      group: 'placement',
    },
  ];

  const panelTools: ToolbarItem[] = [
    {
      id: 'assets',
      icon: Package,
      label: 'Assets',
      onClick: onToggleAssetsPanel,
      active: showAssetsPanel,
      shortcut: 'G',
      group: 'panels',
    },
    {
      id: 'catalogue',
      icon: ShoppingCart,
      label: 'Catalogue',
      onClick: onOpenCatalogue,
      shortcut: 'C',
      group: 'panels',
    },
  ];

  const actionTools: ToolbarItem[] = [
    {
      id: 'undo',
      icon: Undo2,
      label: 'Undo',
      onClick: onUndo,
      disabled: !canUndo,
      shortcut: '⌘Z',
      group: 'actions',
    },
    {
      id: 'export',
      icon: FileDown,
      label: 'Export',
      onClick: onExport,
      disabled: !renderUrl,
      shortcut: 'X',
      group: 'actions',
    },
  ];

  const renderToolGroup = (tools: ToolbarItem[]) => (
    <>
      {tools.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <button
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                'toolbar-item-premium',
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                'text-muted-foreground transition-all duration-200',
                'hover:text-foreground hover:bg-primary/10',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                item.active && 'bg-primary/20 text-primary'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium hidden lg:inline">{item.label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span>{item.label}</span>
            {item.shortcut && (
              <kbd className="kbd text-[10px] px-1.5 py-0.5">{item.shortcut}</kbd>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex-1 flex flex-col bg-gradient-premium relative overflow-hidden">
        {/* Floating Premium Toolbar - Reorganized with Groups */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
          <div className="glass-premium rounded-2xl px-2 py-1.5 flex items-center gap-0.5">
            {/* Selection Tools */}
            {renderToolGroup(selectionTools)}
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* Editing Tools */}
            {renderToolGroup(editingTools)}
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* AI Tools */}
            {renderToolGroup(aiTools)}
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* View Tools */}
            {renderToolGroup(viewTools)}
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* Placement Tools */}
            {renderToolGroup(placementTools)}
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* Panel Tools */}
            {renderToolGroup(panelTools)}
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* Actions */}
            {renderToolGroup(actionTools)}
          </div>
        </div>

        {/* AI Director Input - Floating */}
        {showDirectorInput && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4 animate-slide-up">
            <div className="glass-premium rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <input
                  type="text"
                  value={directorPrompt}
                  onChange={(e) => setDirectorPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isSelectiveEditing && handleDirectorSubmit()}
                  placeholder="Describe how to modify the render..."
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
                  autoFocus
                  disabled={isSelectiveEditing}
                />
                <button
                  onClick={handleDirectorSubmit}
                  disabled={!directorPrompt.trim() || isSelectiveEditing}
                  className="btn-glow px-3 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSelectiveEditing ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating Overlay */}
        {isSelectiveEditing && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-premium rounded-2xl p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Applying AI Director changes...</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
              </div>
            </div>
          </div>
        )}

        {/* 16:9 Render Canvas - Centered */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="aspect-video-premium w-full max-w-[90%] lg:max-w-[85%] relative">
            <div 
              ref={containerRef}
              className={cn(
                'gradient-border gradient-border-subtle rounded-2xl overflow-hidden',
                'w-full h-full',
                isGenerating && 'gradient-border-glow',
                isDrawingZone && 'cursor-crosshair'
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="w-full h-full bg-card/50 relative">
                {/* Render content */}
                {renderUrl ? (
                  <>
                    <img
                      src={renderUrl}
                      alt="Current render"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    
                    {/* Selection overlay - rendered inside image container for proper positioning */}
                    {isSelectionMode && onSelectionComplete && (
                      <div 
                        className="absolute inset-0 z-30 cursor-crosshair"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          setSelectionStart({ x, y });
                          setSelectionCurrent({ x, y });
                        }}
                        onMouseMove={(e) => {
                          if (!selectionStart) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                          const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                          setSelectionCurrent({ x, y });
                        }}
                        onMouseUp={() => {
                          if (selectionStart && selectionCurrent) {
                            const x = Math.min(selectionStart.x, selectionCurrent.x);
                            const y = Math.min(selectionStart.y, selectionCurrent.y);
                            const width = Math.abs(selectionCurrent.x - selectionStart.x);
                            const height = Math.abs(selectionCurrent.y - selectionStart.y);
                            if (width > 2 && height > 2) {
                              onSelectionComplete({ x, y, width, height });
                            }
                          }
                          setSelectionStart(null);
                          setSelectionCurrent(null);
                        }}
                        onMouseLeave={() => {
                          setSelectionStart(null);
                          setSelectionCurrent(null);
                        }}
                      >
                        {/* Darkened overlay when drawing */}
                        {selectionStart && selectionCurrent && (
                          <>
                            {/* Selection rectangle */}
                            <div 
                              className="absolute border-2 border-primary border-dashed bg-primary/10 animate-pulse"
                              style={{
                                left: `${Math.min(selectionStart.x, selectionCurrent.x)}%`,
                                top: `${Math.min(selectionStart.y, selectionCurrent.y)}%`,
                                width: `${Math.abs(selectionCurrent.x - selectionStart.x)}%`,
                                height: `${Math.abs(selectionCurrent.y - selectionStart.y)}%`,
                              }}
                            >
                              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded whitespace-nowrap">
                                {Math.round(Math.abs(selectionCurrent.x - selectionStart.x))}% × {Math.round(Math.abs(selectionCurrent.y - selectionStart.y))}%
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Instruction hint when no selection */}
                        {!selectionStart && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
                              <p className="text-sm text-muted-foreground">Click and drag to select an area to edit</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Zone overlays */}
                    {zones.length > 0 && !isDrawingZone && !isSelectionMode && (
                      <div className="absolute inset-0 pointer-events-none">
                        {zones.map((zone) => (
                          <div
                            key={zone.id}
                            className={cn(
                              'absolute border-2 rounded transition-all duration-200',
                              selectedZoneId === zone.id
                                ? 'border-primary bg-primary/10'
                                : 'border-primary/40'
                            )}
                            style={{
                              left: `${zone.x_start}%`,
                              top: `${zone.y_start}%`,
                              width: `${zone.x_end - zone.x_start}%`,
                              height: `${zone.y_end - zone.y_start}%`,
                            }}
                          >
                            <span className="absolute -top-5 left-1 text-[10px] font-medium text-primary bg-background/80 px-1.5 py-0.5 rounded">
                              {zone.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Pending zone */}
                    {pendingZone && (
                      <div
                        className="absolute border-2 border-dashed border-green-500 bg-green-500/20 pointer-events-none"
                        style={{
                          left: `${pendingZone.x_start}%`,
                          top: `${pendingZone.y_start}%`,
                          width: `${pendingZone.x_end - pendingZone.x_start}%`,
                          height: `${pendingZone.y_end - pendingZone.y_start}%`,
                        }}
                      />
                    )}
                    
                    {/* Current drawing rectangle */}
                    {currentRect && (
                      <div
                        className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
                        style={currentRect}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <div className={cn(
                      'w-20 h-20 rounded-2xl glass-premium flex items-center justify-center',
                      isGenerating && 'animate-pulse'
                    )}>
                      {isGenerating ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGenerating ? 'Generating your vision...' : 'Describe your vision to generate a render'}
                    </p>
                  </div>
                )}

                {/* Generating overlay - enhanced with zone info */}
                {(isGenerating || isMulticamGenerating) && renderUrl && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-md flex items-center justify-center z-20">
                    <div className="glass-premium rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm text-center animate-scale-in">
                      {/* Animated loader with pulse ring */}
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                          <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                      </div>
                      
                      {/* Zone-specific generation info */}
                      {generatingZoneName ? (
                        <>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">
                              Generating {generatingViewType ? viewTypeOptions.find(v => v.id === generatingViewType)?.label : 'View'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Zone: <span className="text-primary font-medium">"{generatingZoneName}"</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span>Creating focused camera view...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-semibold text-foreground">Generating...</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span>AI is crafting your render</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Drawing mode indicator */}
            {isDrawingZone && !drawStart && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 backdrop-blur-md rounded-lg border border-amber-500/30">
                  <Square className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">
                    Click and drag to define a zone
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone name input modal */}
        {showNameInput && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="glass-premium p-4 rounded-xl border border-border shadow-xl max-w-xs w-full mx-4">
              <h3 className="text-sm font-semibold mb-3">Name this zone</h3>
              <Input
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="e.g., Living Area, Kitchen Corner"
                className="mb-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmZone();
                  if (e.key === 'Escape') handleCancelZone();
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleCancelZone}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" className="flex-1" onClick={handleConfirmZone}>
                  <Check className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Zones Panel - Floating Right */}
        {showZonesPanel && (
          <div className="absolute right-4 top-24 z-20 w-72 animate-slide-in-right">
            <div className="glass-premium rounded-xl overflow-hidden">
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
                    onClick={onStartZoneDrawing}
                    disabled={!renderUrl}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleZonesPanel}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Zones list */}
              <div className="max-h-48 overflow-y-auto p-2">
                {zones.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No zones defined</p>
                    <p className="text-[10px] mt-1">Click "Add" to draw a zone</p>
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
                        onClick={() => onZoneSelect?.(zone)}
                      >
                        <div 
                          className="w-8 h-8 rounded bg-muted/50 relative overflow-hidden flex-shrink-0"
                        >
                          <div
                            className="absolute bg-primary/60 border border-primary"
                            style={{
                              left: `${zone.x_start}%`,
                              top: `${zone.y_start}%`,
                              width: `${zone.x_end - zone.x_start}%`,
                              height: `${zone.y_end - zone.y_start}%`,
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{zone.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(zone.x_end - zone.x_start).toFixed(0)}% × {(zone.y_end - zone.y_start).toFixed(0)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onZoneDelete?.(zone.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* View Type Selector - appears when zone is selected */}
              {selectedZoneId && zones.find(z => z.id === selectedZoneId) && (
                <div className="p-3 border-t border-border/30">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Generate View for "{zones.find(z => z.id === selectedZoneId)?.name}"
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {viewTypeOptions.map((viewType) => (
                      <Tooltip key={viewType.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs justify-start gap-2 hover:bg-primary/10 hover:border-primary/50"
                            onClick={() => {
                              const zone = zones.find(z => z.id === selectedZoneId);
                              if (zone) {
                                onGenerateZoneView?.(zone, viewType.id);
                              }
                            }}
                            disabled={isGenerating}
                          >
                            <viewType.icon className="h-3.5 w-3.5" />
                            <span>{viewType.label}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">{viewType.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  {isGenerating && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generating view...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render History Carousel */}
        {allRenders.length > 0 && (
          <RenderHistoryCarousel
            renders={allRenders}
            currentRenderId={currentRenderId}
            onSelect={onRenderHistorySelect}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
