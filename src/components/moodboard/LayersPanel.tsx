import { GripVertical, Settings } from "lucide-react";
import { MaterialsPalette } from "./MaterialsPalette";
import { DesignerNotes } from "./DesignerNotes";
import type { Material, DesignerNote } from "@/pages/MoodBoardWorkspace";

interface LayersPanelProps {
  materials: Material[];
  notes: DesignerNote[];
}

export const LayersPanel = ({ materials, notes }: LayersPanelProps) => {
  return (
    <aside className="w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Settings Icon */}
      <div className="p-3 border-b border-white/10 flex justify-end">
        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white/80">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Project Blueprint */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
            Project Blueprint
          </span>
          <GripVertical className="w-4 h-4 text-white/30" />
        </div>
        
        {/* Mini Navigation Icons */}
        <div className="flex gap-2">
          {["near_me", "photo_library", "palette", "sticky_note_2", "category"].map((icon, i) => (
            <button 
              key={i}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white/80 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Materials Palette */}
      <MaterialsPalette materials={materials} />

      {/* Designer Notes */}
      <DesignerNotes notes={notes} />
    </aside>
  );
};
