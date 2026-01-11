import { ChevronDown, Share2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceHeaderProps {
  project: {
    name: string;
    subtitle: string;
  };
}

export const WorkspaceHeader = ({ project }: WorkspaceHeaderProps) => {
  return (
    <header className="h-14 border-b border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-white/60">
          <Layers className="w-5 h-5" />
        </div>
        <span className="text-lg font-semibold tracking-wide text-white">
          VISIONCANVAS
        </span>
      </div>

      {/* Center - Project Info */}
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">
          <span className="text-white/90">
            Project: <span className="font-medium">{project.name}</span>
            <span className="text-white/50">/{project.subtitle}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-white/50" />
        </button>

        {/* Tabs */}
        <div className="flex items-center gap-1 text-sm">
          <button className="px-3 py-1.5 text-purple-400 border-b-2 border-purple-400">
            Design
          </button>
          <button className="px-3 py-1.5 text-white/50 hover:text-white/80 transition-colors">
            Visualize
          </button>
          <button className="px-3 py-1.5 text-white/50 hover:text-white/80 transition-colors">
            Present
          </button>
        </div>
      </div>

      {/* Right - Share */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-white/20 bg-white/5 hover:bg-white/10 text-white gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </header>
  );
};
