import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Settings2, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ControlButtonsProps {
  memoryEnabled: boolean;
  agentBEnabled: boolean;
  onMemoryToggle: () => void;
  onAgentBToggle: () => void;
}

export function ControlButtons({
  memoryEnabled,
  agentBEnabled,
  onMemoryToggle,
  onAgentBToggle,
}: ControlButtonsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex justify-center gap-2 mb-6"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 glass border-border/50 hover:border-primary/40"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Tools</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="glass-premium">
            <p className="text-xs">Configure generation settings</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMemoryToggle}
              className={cn(
                "gap-2 transition-all duration-300 glass",
                memoryEnabled 
                  ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15" 
                  : "border-border/50 hover:border-primary/40"
              )}
            >
              <Brain className={cn(
                "w-4 h-4 transition-all duration-300",
                memoryEnabled && "text-primary"
              )} />
              <span className="hidden sm:inline">Memory:</span> {memoryEnabled ? "ON" : "OFF"}
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
                "gap-2 transition-all duration-300 glass",
                agentBEnabled 
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-400 hover:bg-violet-500/15" 
                  : "border-border/50 hover:border-violet-500/40"
              )}
            >
              <Sparkles className={cn(
                "w-4 h-4 transition-all duration-300",
                agentBEnabled && "text-violet-400"
              )} />
              <span className="hidden sm:inline">Agent B:</span> {agentBEnabled ? "ON" : "OFF"}
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
