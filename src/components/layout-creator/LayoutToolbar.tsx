import { 
  MousePointer, 
  Move, 
  Minus, 
  Square, 
  DoorOpen, 
  Armchair,
  RotateCw,
  Trash2,
  Undo,
  Redo,
  Grid3X3,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LayoutTool } from '@/types/layout-creator';
import { cn } from '@/lib/utils';

interface LayoutToolbarProps {
  activeTool: LayoutTool;
  onToolChange: (tool: LayoutTool) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onRotate: () => void;
  hasSelection: boolean;
}

const tools: { id: LayoutTool; label: string; icon: React.ReactNode; shortcut: string; highlight?: boolean }[] = [
  { id: 'select', label: 'Select', icon: <MousePointer className="h-4 w-4" />, shortcut: 'V' },
  { id: 'move', label: 'Pan', icon: <Move className="h-4 w-4" />, shortcut: 'H' },
  { id: 'wall', label: 'Wall', icon: <Minus className="h-4 w-4" />, shortcut: 'W' },
  { id: 'window', label: 'Window', icon: <Square className="h-4 w-4" />, shortcut: 'N' },
  { id: 'door', label: 'Door', icon: <DoorOpen className="h-4 w-4" />, shortcut: 'D' },
  { id: 'furniture', label: 'Furniture', icon: <Armchair className="h-4 w-4" />, shortcut: 'F' },
  { id: 'ai-zone', label: 'AI Zone', icon: <Sparkles className="h-4 w-4" />, shortcut: 'A', highlight: true },
];

export function LayoutToolbar({
  activeTool,
  onToolChange,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onUndo,
  onRedo,
  onDelete,
  onRotate,
  hasSelection,
}: LayoutToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 bg-card border-b border-border">
      {/* Tools */}
      <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0',
                  activeTool === tool.id && 'bg-background shadow-sm',
                  tool.highlight && activeTool !== tool.id && 'text-primary hover:text-primary',
                  tool.highlight && activeTool === tool.id && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                onClick={() => onToolChange(tool.id)}
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tool.label} ({tool.shortcut})</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Object Actions */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onRotate}
              disabled={!hasSelection}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Rotate 15° (R)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={!hasSelection}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Delete (Del)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onUndo}>
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRedo}>
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Redo (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Grid & Snap */}
      <div className="flex items-center gap-1">
        <Toggle
          pressed={showGrid}
          onPressedChange={onToggleGrid}
          size="sm"
          className="h-8 px-2 gap-1"
        >
          <Grid3X3 className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Grid</span>
        </Toggle>

        <Toggle
          pressed={snapToGrid}
          onPressedChange={onToggleSnap}
          size="sm"
          className="h-8 px-2 gap-1"
        >
          <Magnet className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Snap</span>
        </Toggle>
      </div>

      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Zoom Out (-)</p>
          </TooltipContent>
        </Tooltip>

        <span className="text-xs font-medium w-12 text-center">{zoom}%</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Zoom In (+)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onFitToScreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Fit to Screen</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
