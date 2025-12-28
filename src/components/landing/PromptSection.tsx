import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptSectionProps {
  projectName: string;
  prompt: string;
  isGenerating: boolean;
  onProjectNameChange: (name: string) => void;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
}

export function PromptSection({
  projectName,
  prompt,
  isGenerating,
  onProjectNameChange,
  onPromptChange,
  onGenerate,
}: PromptSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="w-full max-w-2xl"
    >
      <div className="relative glass-premium rounded-xl overflow-hidden border border-border/30">
        {/* Project Name + Prompt in row on larger screens */}
        <div className="flex flex-col sm:flex-row">
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Project name"
            className={cn(
              "flex-shrink-0 px-5 py-4 bg-transparent",
              "text-base font-medium text-foreground",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none border-b sm:border-b-0 sm:border-r border-border/20",
              "sm:w-48"
            )}
          />
          
          <div className="relative flex-1">
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe your dream space..."
              className={cn(
                "min-h-[100px] px-5 py-4 pr-16 resize-none",
                "bg-transparent border-0",
                "text-foreground placeholder:text-muted-foreground/40",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-base leading-relaxed"
              )}
            />
            
            <Button
              size="icon"
              onClick={onGenerate}
              disabled={isGenerating}
              className={cn(
                "absolute bottom-4 right-4 h-11 w-11 rounded-lg",
                "bg-primary hover:bg-primary/90",
                "shadow-[0_0_20px_hsl(217_100%_58%/0.3)]",
                "transition-all duration-200",
                "hover:scale-105",
                "disabled:opacity-50"
              )}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground/40 mt-3">
        <kbd className="kbd text-xs">⌘</kbd> + <kbd className="kbd text-xs">Enter</kbd>
      </p>
    </motion.div>
  );
}
