import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings2, Brain, Sparkles, Grid3X3, Lightbulb, Zap, Droplets, Sofa, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.3 }}
      className="flex justify-center gap-2 mb-6"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 gap-2 text-sm text-muted-foreground/60 hover:text-foreground hover:bg-[hsl(220,25%,12%/0.5)] px-3 rounded-full border border-transparent hover:border-[hsl(220,25%,20%/0.3)]"
          >
            <Settings2 className="w-4 h-4" />
            <span>Tools</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 bg-[hsl(220,25%,8%/0.95)] backdrop-blur-xl border-[hsl(220,25%,20%/0.3)] z-50">
          {drawingTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => navigate(`/tools/${tool.id}`)}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-cyan-500/10"
              >
                <ToolIcon className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="font-medium text-sm">{tool.title}</p>
                  <p className="text-xs text-muted-foreground/60">{tool.subtitle}</p>
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
          "h-9 gap-2 text-sm px-3 rounded-full border transition-all",
          memoryEnabled 
            ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" 
            : "text-muted-foreground/60 border-transparent hover:text-foreground hover:bg-[hsl(220,25%,12%/0.5)] hover:border-[hsl(220,25%,20%/0.3)]"
        )}
      >
        <Brain className="w-4 h-4" />
        <span>Memory</span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          memoryEnabled ? "bg-cyan-500/20 text-cyan-400" : "bg-muted/50 text-muted-foreground/60"
        )}>
          {memoryEnabled ? "ON" : "OFF"}
        </span>
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onAgentBToggle}
        className={cn(
          "h-9 gap-2 text-sm px-3 rounded-full border transition-all",
          agentBEnabled 
            ? "text-violet-400 border-violet-500/30 bg-violet-500/10" 
            : "text-muted-foreground/60 border-transparent hover:text-foreground hover:bg-[hsl(220,25%,12%/0.5)] hover:border-[hsl(220,25%,20%/0.3)]"
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>Agent B</span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          agentBEnabled ? "bg-violet-500/20 text-violet-400" : "bg-muted/50 text-muted-foreground/60"
        )}>
          {agentBEnabled ? "ON" : "OFF"}
        </span>
      </Button>
    </motion.div>
  );
}
