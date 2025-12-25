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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="w-full max-w-2xl space-y-4"
    >
      {/* Project Name Input - Required */}
      <div className="relative">
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Project name *"
          required
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "glass-input text-sm font-medium",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none",
            !projectName.trim() && "border-destructive/50"
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive text-sm font-medium">
          *
        </span>
      </div>
      
      {/* Prompt Textarea */}
      <div className="relative group">
        <div className={cn(
          "absolute -inset-px rounded-2xl opacity-0 group-focus-within:opacity-100",
          "bg-gradient-to-r from-primary/50 via-violet-500/50 to-primary/50",
          "transition-opacity duration-500 blur-sm"
        )} />
        
        <div className="relative glass-premium rounded-2xl overflow-hidden">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe your dream space... A cozy bedroom with warm tones, natural materials, and soft lighting"
            className={cn(
              "min-h-[120px] pr-16 resize-none",
              "bg-transparent border-0",
              "text-foreground placeholder:text-muted-foreground/50",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-base leading-relaxed"
            )}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground/50 hidden sm:block">
              {prompt.length > 0 && `${prompt.length} chars`}
            </span>
            <Button
              size="icon"
              onClick={onGenerate}
              disabled={isGenerating}
              className={cn(
                "h-10 w-10 rounded-xl",
                "bg-primary hover:bg-primary/90",
                "shadow-[0_0_20px_hsl(217_100%_58%/0.3)]",
                "transition-all duration-300",
                "hover:shadow-[0_0_30px_hsl(217_100%_58%/0.5)]",
                "hover:scale-105",
                "disabled:opacity-50 disabled:hover:scale-100"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Keyboard hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-muted-foreground/50"
      >
        Press <kbd className="kbd mx-1">⌘</kbd> + <kbd className="kbd">Enter</kbd> to generate
      </motion.p>
    </motion.div>
  );
}
