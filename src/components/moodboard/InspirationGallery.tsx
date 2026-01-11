import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InspirationGallery = () => {
  const inspirations = [
    { id: "1", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300", label: "Modern Kitchen Layout" },
    { id: "2", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300", label: "Scandinavian Bedroom" },
    { id: "3", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300", label: "Minimalist Office" }
  ];

  return (
    <div className="px-6 py-3 border-t border-white/10 bg-black/20">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider whitespace-nowrap">
          Inspiration Gallery
        </span>
        
        <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-1">
          {inspirations.map((item) => (
            <div 
              key={item.id}
              className="relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors cursor-pointer group"
            >
              <img 
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                <span className="text-[10px] text-white/90 font-medium leading-tight">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          size="sm"
          className="border-dashed border-white/20 bg-transparent hover:bg-white/5 text-white/70 gap-2 flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
          Import Assets
        </Button>
      </div>
    </div>
  );
};
