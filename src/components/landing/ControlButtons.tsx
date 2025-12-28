import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings2, Brain, Sparkles, Grid3X3, Lightbulb, Zap, Droplets, Sofa, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ControlButtonsProps {
  memoryEnabled: boolean;
  agentBEnabled: boolean;
  onMemoryToggle: () => void;
  onAgentBToggle: () => void;
}

const drawingTools = [
  { id: "floor-plan", icon: Grid3X3, title: "Architectural Floor Plan", subtitle: "Walls, rooms, dimensions" },
  { id: "rcp", icon: Lightbulb, title: "RCP - Reflected Ceiling Plan", subtitle: "Ceiling, lights, AC" },
  { id: "electrical", icon: Zap, title: "Electrical Plan", subtitle: "Switches, sockets, circuits" },
  { id: "plumbing", icon: Droplets, title: "Plumbing & Sanitary Plan", subtitle: "Water supply, drainage" },
  { id: "furniture", icon: Sofa, title: "Furniture / Interior Layout", subtitle: "Furniture placement" },
];

export function ControlButtons({
  memoryEnabled,
  agentBEnabled,
  onMemoryToggle,
  onAgentBToggle,
}: ControlButtonsProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        className="flex justify-center gap-2 mb-4"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-sm text-muted-foreground hover:text-foreground px-3">
              <Settings2 className="w-4 h-4" />
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 bg-popover border-border z-50">
            {drawingTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <DropdownMenuItem
                  key={tool.id}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                  className="flex items-center gap-2 py-2 cursor-pointer"
                >
                  <ToolIcon className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{tool.title}</p>
                    <p className="text-xs text-muted-foreground">{tool.subtitle}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onMemoryToggle}
          className={cn(
            "h-8 gap-2 text-sm px-3",
            memoryEnabled ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Brain className="w-4 h-4" />
          <span>Memory</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded",
            memoryEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {memoryEnabled ? "ON" : "OFF"}
          </span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onAgentBToggle}
          className={cn(
            "h-8 gap-2 text-sm px-3",
            agentBEnabled ? "text-violet-400" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Agent B</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded",
            agentBEnabled ? "bg-violet-500/20 text-violet-400" : "bg-muted text-muted-foreground"
          )}>
            {agentBEnabled ? "ON" : "OFF"}
          </span>
        </Button>
      </motion.div>
    </TooltipProvider>
  );
}
