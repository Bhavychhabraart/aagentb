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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex justify-center gap-2 mb-6"
      >
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 glass-premium border-border/30 hover:border-primary/40 rounded-full px-4"
                >
                  <Settings2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Tools</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-premium">
              <p className="text-xs">Architectural drawing tools</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-72 bg-popover border-border z-50">
            {drawingTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <DropdownMenuItem
                  key={tool.id}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <ToolIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{tool.title}</p>
                    <p className="text-xs text-muted-foreground">{tool.subtitle}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMemoryToggle}
              className={cn(
                "gap-2 transition-all duration-300 rounded-full px-4",
                memoryEnabled 
                  ? "glass-premium border-primary/50 bg-primary/10 text-primary hover:bg-primary/15" 
                  : "glass-premium border-border/30 hover:border-primary/40"
              )}
            >
              <Brain className={cn(
                "w-4 h-4 transition-all duration-300",
                memoryEnabled && "text-primary"
              )} />
              <span className="text-xs">Memory</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                memoryEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {memoryEnabled ? "ON" : "OFF"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass-premium max-w-xs">
            <p className="text-xs">Learn and remember your design preferences across sessions</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAgentBToggle}
              className={cn(
                "gap-2 transition-all duration-300 rounded-full px-4",
                agentBEnabled 
                  ? "glass-premium border-violet-500/50 bg-violet-500/10 text-violet-400 hover:bg-violet-500/15" 
                  : "glass-premium border-border/30 hover:border-violet-500/40"
              )}
            >
              <Sparkles className={cn(
                "w-4 h-4 transition-all duration-300",
                agentBEnabled && "text-violet-400"
              )} />
              <span className="text-xs">Agent B</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                agentBEnabled ? "bg-violet-500/20 text-violet-400" : "bg-muted text-muted-foreground"
              )}>
                {agentBEnabled ? "ON" : "OFF"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass-premium max-w-xs">
            <p className="text-xs">Interactive questionnaire for refined design generation</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
