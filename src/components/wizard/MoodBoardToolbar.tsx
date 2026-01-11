import { motion } from 'framer-motion';
import { 
  MousePointer, 
  Move, 
  Square, 
  Plus, 
  Palette, 
  Image, 
  Sparkles,
  FileText,
  Undo,
  Redo,
  Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MoodBoardToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onOpenBOQ: () => void;
  onOpenCustomProduct: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

const tools = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'pan', icon: Move, label: 'Pan' },
  { id: 'zone', icon: Square, label: 'Draw Zone' },
];

export function MoodBoardToolbar({
  activeTool,
  onToolChange,
  onOpenBOQ,
  onOpenCustomProduct,
  showGrid,
  onToggleGrid,
}: MoodBoardToolbarProps) {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left: Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onToolChange(tool.id)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* Add Product */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Plus className="w-4 h-4" />
              <span className="text-xs">Add Product</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Add from catalog</p>
          </TooltipContent>
        </Tooltip>

        {/* Create Custom */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-2"
              onClick={onOpenCustomProduct}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs">AI Generate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Create custom product with AI</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* Grid Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showGrid ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleGrid}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Toggle Grid</p>
          </TooltipContent>
        </Tooltip>

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Undo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Redo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right: BOQ Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={onOpenBOQ}
        >
          <FileText className="w-4 h-4" />
          <span className="text-xs">View BOQ</span>
        </Button>
      </div>
    </div>
  );
}
