import type { Material } from "@/pages/MoodBoardWorkspace";

interface MaterialsPaletteProps {
  materials: Material[];
}

export const MaterialsPalette = ({ materials }: MaterialsPaletteProps) => {
  return (
    <div className="p-3 border-b border-white/10">
      <div className="space-y-2">
        {materials.map((material) => (
          <div 
            key={material.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
          >
            <div 
              className="w-10 h-10 rounded-lg border border-white/20 shadow-inner"
              style={{ backgroundColor: material.color }}
            />
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">
              {material.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
