import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/pages/MoodBoardWorkspace";

interface ProductCardProps {
  product: Product;
  onClose: () => void;
}

export const ProductCard = ({ product, onClose }: ProductCardProps) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="absolute bottom-1/4 right-1/4 translate-x-12 w-72 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-full transition-colors z-10"
      >
        <X className="w-4 h-4 text-white/60" />
      </button>

      {/* Product Image */}
      <div className="h-40 overflow-hidden">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          <p className="text-2xl font-bold text-white mt-1">{formattedPrice}</p>
        </div>

        {product.tagline && (
          <p className="text-sm text-white/60">{product.tagline}</p>
        )}

        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
        >
          Add to Collection
        </Button>
      </div>
    </div>
  );
};
