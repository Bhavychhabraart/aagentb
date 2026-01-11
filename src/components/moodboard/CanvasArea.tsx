import { ProductCard } from "./ProductCard";
import { QuickAddBar } from "./QuickAddBar";
import { InspirationGallery } from "./InspirationGallery";
import type { Product } from "@/pages/MoodBoardWorkspace";

interface CanvasAreaProps {
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  zoomLevel: number;
}

export const CanvasArea = ({ selectedProduct, onProductSelect, zoomLevel }: CanvasAreaProps) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background Render */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[600px] mx-auto">
            {/* Room Render Image */}
            <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200"
                alt="Living Room Render"
                className="w-full h-full object-cover opacity-90"
              />
              
              {/* Overlay Labels */}
              <div className="absolute top-6 left-6 space-y-2">
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm text-white/90 border border-white/20">
                  Serene Living Area
                </span>
                <div>
                  <span className="px-3 py-1.5 bg-purple-500/20 backdrop-blur-md rounded-full text-sm text-purple-300 border border-purple-500/30">
                    Minimalist Elegance
                  </span>
                </div>
              </div>

              {/* Product Hotspot */}
              <button 
                onClick={() => onProductSelect(selectedProduct)}
                className="absolute bottom-1/3 right-1/4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </button>
            </div>

            {/* Product Detail Card */}
            {selectedProduct && (
              <ProductCard 
                product={selectedProduct} 
                onClose={() => onProductSelect(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <QuickAddBar />

      {/* Inspiration Gallery */}
      <InspirationGallery />
    </main>
  );
};
