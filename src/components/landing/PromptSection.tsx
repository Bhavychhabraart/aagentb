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
      transition={{ delay: 0.9, duration: 0.5 }}
      className="w-full max-w-2xl space-y-4"
    >
      {/* Floating glass container */}
      <div className="relative">
        {/* Outer glow on focus */}
        <div className={cn(
          "absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-500",
          "bg-gradient-to-r from-primary/40 via-violet-500/40 to-primary/40",
          "blur-md group-focus-within:opacity-100"
        )} />
        
        <div className="relative glass-premium rounded-2xl overflow-hidden border border-border/30">
          {/* Project Name Input */}
          <div className="border-b border-border/20">
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Project name *"
              required
              className={cn(
                "w-full px-5 py-4 bg-transparent",
                "text-sm font-medium text-foreground",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none",
                "transition-all duration-300"
              )}
            />
          </div>
          
          {/* Prompt Textarea */}
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe your dream space... A cozy bedroom with warm tones, natural materials, and soft lighting"
              className={cn(
                "min-h-[140px] px-5 py-4 pr-20 resize-none",
                "bg-transparent border-0",
                "text-foreground placeholder:text-muted-foreground/40",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-base leading-relaxed"
              )}
            />
            
            {/* Actions */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <span className="text-xs text-muted-foreground/40 hidden sm:block">
                {prompt.length > 0 && `${prompt.length}`}
              </span>
              <Button
                size="icon"
                onClick={onGenerate}
                disabled={isGenerating}
                className={cn(
                  "h-11 w-11 rounded-xl",
                  "bg-primary hover:bg-primary/90",
                  "shadow-[0_0_25px_hsl(217_100%_58%/0.4)]",
                  "transition-all duration-300",
                  "hover:shadow-[0_0_35px_hsl(217_100%_58%/0.6)]",
                  "hover:scale-105",
                  "disabled:opacity-50 disabled:hover:scale-100"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Keyboard hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-center text-xs text-muted-foreground/40"
      >
        Press <kbd className="kbd mx-1">⌘</kbd> + <kbd className="kbd">Enter</kbd> to generate
      </motion.p>
    </motion.div>
  );
}
