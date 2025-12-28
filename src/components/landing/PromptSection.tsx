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
      className="w-full max-w-3xl"
    >
      <div className="relative glass-premium rounded-2xl overflow-hidden border border-border/30">
        {/* Project Name + Prompt in row on larger screens */}
        <div className="flex flex-col sm:flex-row">
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Project name"
            className={cn(
              "flex-shrink-0 px-6 py-5 bg-transparent",
              "text-lg font-medium text-foreground",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none border-b sm:border-b-0 sm:border-r border-border/20",
              "sm:w-56"
            )}
          />
          
          <div className="relative flex-1">
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe your dream space..."
              className={cn(
                "min-h-[120px] px-6 py-5 pr-20 resize-none",
                "bg-transparent border-0",
                "text-foreground placeholder:text-muted-foreground/40",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-lg leading-relaxed"
              )}
            />
            
            <Button
              size="icon"
              onClick={onGenerate}
              disabled={isGenerating}
              className={cn(
                "absolute bottom-5 right-5 h-14 w-14 rounded-xl",
                "bg-primary hover:bg-primary/90",
                "shadow-[0_0_20px_hsl(217_100%_58%/0.3)]",
                "transition-all duration-200",
                "hover:scale-105",
                "disabled:opacity-50"
              )}
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      <p className="text-center text-sm text-muted-foreground/40 mt-4">
        <kbd className="kbd text-sm">⌘</kbd> + <kbd className="kbd text-sm">Enter</kbd>
      </p>
    </motion.div>
  );
}
