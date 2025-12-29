import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Play } from "lucide-react";
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
      transition={{ delay: 0.7, duration: 0.4 }}
      className="w-full max-w-3xl space-y-6"
    >
      {/* Dual CTA Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-cyan-500 hover:bg-cyan-400 text-background font-medium px-8 py-5 h-auto text-base shadow-[0_0_30px_hsl(185,100%,50%/0.3)] hover:shadow-[0_0_40px_hsl(185,100%,50%/0.5)] transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Get Started"
          )}
        </Button>
        
        <Button
          variant="outline"
          className="border-[hsl(220,25%,25%/0.5)] bg-transparent hover:bg-[hsl(220,25%,12%/0.5)] text-foreground/80 hover:text-foreground px-8 py-5 h-auto text-base transition-all"
        >
          <Play className="w-4 h-4 mr-2" />
          See Demo
        </Button>
      </div>

      {/* Glass Input Container */}
      <div className="relative rounded-2xl overflow-hidden bg-[hsl(220,25%,8%/0.5)] backdrop-blur-xl border border-[hsl(220,25%,20%/0.3)] transition-all focus-within:border-cyan-500/30 focus-within:shadow-[0_0_30px_hsl(185,100%,50%/0.1)]">
        <div className="flex flex-col sm:flex-row">
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Project name"
            className={cn(
              "flex-shrink-0 px-5 py-4 bg-transparent",
              "text-base font-medium text-foreground",
              "placeholder:text-muted-foreground/40",
              "focus:outline-none border-b sm:border-b-0 sm:border-r border-[hsl(220,25%,20%/0.3)]",
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
                "text-foreground placeholder:text-muted-foreground/30",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-base leading-relaxed"
              )}
            />
            
            <Button
              size="icon"
              onClick={onGenerate}
              disabled={isGenerating}
              className={cn(
                "absolute bottom-4 right-4 h-12 w-12 rounded-xl",
                "bg-cyan-500 hover:bg-cyan-400",
                "shadow-[0_0_20px_hsl(185,100%,50%/0.3)]",
                "transition-all duration-200",
                "hover:scale-105 hover:shadow-[0_0_30px_hsl(185,100%,50%/0.5)]",
                "disabled:opacity-50"
              )}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground/30 mt-3">
        <kbd className="kbd text-xs bg-[hsl(220,25%,12%/0.5)] border-[hsl(220,25%,20%/0.3)]">⌘</kbd>
        {" + "}
        <kbd className="kbd text-xs bg-[hsl(220,25%,12%/0.5)] border-[hsl(220,25%,20%/0.3)]">Enter</kbd>
        {" to generate"}
      </p>
    </motion.div>
  );
}
