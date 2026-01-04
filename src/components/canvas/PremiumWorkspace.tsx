import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  MousePointer2, 
  Wand2, 
  Layers, 
  Move, 
  Undo2, 
  FileDown,
  Loader2,
  ImageIcon,
  Sparkles,
  Camera,
  Eye,
  Film,
  User,
  ArrowUp,
  Clapperboard,
  ScanSearch,
  Package,
  Target,
  ShoppingCart,
  Download,
  Maximize2,
  RefreshCcw,
  Plus,
  X,
  Trash2,
  Columns2
} from 'lucide-react';
import { RenderHistoryCarousel, RenderHistoryItem } from './RenderHistoryCarousel';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { CameraView, ZoneRegion, MulticamPanel } from './MulticamPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
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

// Import Zone from ZoneSelector for consistency
import { Zone, PolygonPoint } from './ZoneSelector';
export type { Zone, PolygonPoint };

interface PremiumWorkspaceProps {
  renderUrl: string | null;
  isGenerating: boolean;
  allRenders: RenderHistoryItem[];
  currentRenderId: string | null;
  onRenderHistorySelect: (render: RenderHistoryItem) => void;
  onDeleteRender?: (renderId: string) => void;
  // Toolbar actions
  onSelectiveEdit?: () => void;
  onAIDirectorChange?: (directive: string) => void;
  onMulticamGenerate?: (view: CameraView, customPrompt?: string, zone?: ZoneRegion) => void;
  onToggleMulticamPanel?: () => void;
  showMulticamPanel?: boolean;
  onPositionFurniture?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isSelectiveEditing?: boolean;
  isMulticamGenerating?: boolean;
  multicamViews?: Record<CameraView, string | null>;
  onSetMulticamAsMain?: (imageUrl: string) => void;
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
  onCompareZone?: (zone: Zone) => void;
  onToggleZonesPanel?: () => void;
  // Zone generation state
  generatingZoneName?: string | null;
  generatingViewType?: ViewType | null;
  // New enhanced tools
  onToggleAIDetection?: () => void;
  isAIDetectionActive?: boolean;
  onToggleMagicSelect?: () => void;
  isMagicSelectActive?: boolean;
  onToggleAutoFurnish?: () => void;
  showAutoFurnish?: boolean;
  onToggleAssetsPanel?: () => void;
  showAssetsPanel?: boolean;
  onOpenCatalog?: () => void;
  // Selection tool props
  isSelectionMode?: boolean;
  onSelectionComplete?: (region: { x: number; y: number; width: number; height: number } | null) => void;
  // Start Over and Upscale props
  onStartOver?: () => void;
  onUpscale?: () => void;
  isUpscaling?: boolean;
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
  onDeleteRender,
  onSelectiveEdit,
  onAIDirectorChange,
  onMulticamGenerate,
  onToggleMulticamPanel,
  showMulticamPanel,
  multicamViews = { perspective: null, front: null, side: null, top: null, cinematic: null, custom: null },
  onSetMulticamAsMain,
  onPositionFurniture,
  onExport,
  onUndo,
  canUndo,
  isSelectiveEditing,
  isMulticamGenerating,
  projectId,
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
  onCompareZone,
  onToggleZonesPanel,
  generatingZoneName,
  generatingViewType,
  // New enhanced tools
  onToggleAIDetection,
  isAIDetectionActive,
  onToggleMagicSelect,
  isMagicSelectActive,
  onToggleAutoFurnish,
  showAutoFurnish,
  onToggleAssetsPanel,
  showAssetsPanel,
  onOpenCatalog,
  stagedItems,
  // Selection tool props
  isSelectionMode,
  onSelectionComplete,
  // Start Over and Upscale props
  onStartOver,
  onUpscale,
  isUpscaling,
}: PremiumWorkspaceProps) {
  const [showDirectorInput, setShowDirectorInput] = useState(false);
  const [directorPrompt, setDirectorPrompt] = useState('');
  
  // Ref for the container
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Selection tool state (internal)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);

  // Get selected zone from zones array
  const selectedZone = zones.find(z => z.id === selectedZoneId);

  const handleDirectorSubmit = () => {
    if (directorPrompt.trim() && onAIDirectorChange) {
      onAIDirectorChange(directorPrompt);
      setDirectorPrompt('');
      setShowDirectorInput(false);
    }
  };

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
      id: 'magicSelect',
      icon: Target,
      label: 'Magic',
      onClick: onToggleMagicSelect,
      disabled: !renderUrl || isGenerating,
      active: isMagicSelectActive,
      shortcut: 'G',
      group: 'selection',
    },
  ];

  const editingTools: ToolbarItem[] = [
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
      icon: Camera,
      label: 'Views',
      onClick: onToggleMulticamPanel,
      disabled: !renderUrl || isGenerating,
      active: showMulticamPanel,
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
      id: 'catalog',
      icon: ShoppingCart,
      label: 'Catalog',
      onClick: onOpenCatalog,
      shortcut: 'C',
      group: 'panels',
    },
  ];

  const actionTools: ToolbarItem[] = [
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      onClick: async () => {
        if (renderUrl) {
          const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
          const link = document.createElement('a');
          link.href = renderUrl;
          link.download = formatDownloadFilename('render', 'project', 'png');
          link.click();
        }
      },
      disabled: !renderUrl,
      shortcut: 'W',
      group: 'actions',
    },
    {
      id: 'upscale',
      icon: isUpscaling ? Loader2 : Maximize2,
      label: isUpscaling ? 'Upscaling...' : 'Upscale HD',
      onClick: onUpscale,
      disabled: !renderUrl || isUpscaling || isGenerating,
      shortcut: 'U',
      group: 'actions',
    },
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

  const startOverTools: ToolbarItem[] = [
    {
      id: 'startover',
      icon: RefreshCcw,
      label: 'Start Over',
      onClick: onStartOver,
      group: 'startover',
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
            
            <Separator orientation="vertical" className="h-6 mx-1 bg-border/30" />
            
            {/* Start Over */}
            {renderToolGroup(startOverTools)}
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

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="aspect-video-premium w-full max-w-[90%] lg:max-w-[85%] relative">
            <div 
              ref={containerRef}
              className={cn(
                'gradient-border gradient-border-subtle rounded-2xl overflow-hidden',
                'w-full h-full',
                isGenerating && 'gradient-border-glow'
              )}
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
                    
                    {/* Zone overlays - display only, drawing is done in LayoutZoneModal */}
                    {zones.length > 0 && !isSelectionMode && (
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
          </div>
        </div>

        {/* Multicam Panel - Floating Bottom Left */}
        {showMulticamPanel && renderUrl && onMulticamGenerate && onToggleMulticamPanel && (
          <MulticamPanel
            onGenerateView={onMulticamGenerate}
            isGenerating={isMulticamGenerating || false}
            generatedViews={multicamViews}
            onSelectView={(view, url) => onSetMulticamAsMain?.(url)}
            onClose={onToggleMulticamPanel}
            onSetAsMain={onSetMulticamAsMain}
            projectId={projectId}
          />
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
                          {/* Compare zone button */}
                          {onCompareZone && renderUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-cyan-400 hover:text-cyan-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompareZone(zone);
                              }}
                              title="Compare zone with generated render"
                            >
                              <Columns2 className="h-3 w-3" />
                            </Button>
                          )}
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
            onDelete={onDeleteRender}
            hasZoneComparison={!!selectedZone}
            onCompareZone={selectedZone ? () => onCompareZone?.(selectedZone) : undefined}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
