import { ZoomIn, ZoomOut, Sparkles, Upload, Send, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkspaceFooterProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  visionAIEnabled: boolean;
  onToggleVisionAI: () => void;
  promptText: string;
  onPromptChange: (text: string) => void;
  onSendPrompt: () => void;
}

export const WorkspaceFooter = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  visionAIEnabled,
  onToggleVisionAI,
  promptText,
  onPromptChange,
  onSendPrompt
}: WorkspaceFooterProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSendPrompt();
    }
  };

  return (
    <footer className="h-14 border-t border-white/10 bg-black/30 backdrop-blur-xl flex items-center justify-between px-4 gap-4">
      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onZoomOut}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white/80"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm text-white/70 min-w-[3rem] text-center">{zoomLevel}%</span>
        <button 
          onClick={onZoomIn}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white/80"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Vision AI Toggle */}
      <button 
        onClick={onToggleVisionAI}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
          visionAIEnabled 
            ? "bg-green-500/20 text-green-400 border border-green-500/30" 
            : "bg-white/5 text-white/50 border border-white/10"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Vision AI</span>
        <span className="text-xs uppercase">{visionAIEnabled ? "ON" : "OFF"}</span>
      </button>

      {/* Team Avatars */}
      <div className="flex items-center -space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white"
          >
            {String.fromCharCode(64 + i)}
          </div>
        ))}
        <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-slate-900 flex items-center justify-center text-[10px] font-medium text-white/70">
          +4
        </div>
      </div>

      {/* Import Button */}
      <Button 
        variant="outline" 
        size="sm"
        className="border-white/20 bg-white/5 hover:bg-white/10 text-white gap-2"
      >
        <Upload className="w-4 h-4" />
        Import Assets
      </Button>

      {/* Prompt Input */}
      <div className="flex-1 max-w-md flex items-center gap-2">
        <div className="flex-1 relative">
          <Input 
            placeholder="Describe your vision..."
            value={promptText}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/30">
            <Command className="w-3 h-3" />
            <span className="text-xs">+ Enter</span>
          </div>
        </div>
        <Button 
          onClick={onSendPrompt}
          size="icon"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </footer>
  );
};
