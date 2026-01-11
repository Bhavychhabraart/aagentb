import { useState } from "react";
import { Search, Filter, Plus, ChevronDown, ChevronRight, Armchair, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Product } from "@/pages/MoodBoardWorkspace";

interface CuratedLibraryProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddProduct: (product: Product) => void;
}

export const CuratedLibrary = ({ products, searchQuery, onSearchChange, onAddProduct }: CuratedLibraryProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Seating", "Illumination"]));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const seatingProducts = products.filter(p => p.category === "Seating");
  const lightingProducts = products.filter(p => p.category === "Illumination");

  const CategoryIcon = ({ category }: { category: string }) => {
    if (category === "Seating") return <Armchair className="w-4 h-4" />;
    if (category === "Illumination") return <Lightbulb className="w-4 h-4" />;
    return null;
  };

  return (
    <aside className="w-72 border-l border-white/10 bg-black/20 backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white mb-3">Curated Library</h2>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
            />
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-auto">
        {/* Seating Category */}
        <div className="border-b border-white/10">
          <button 
            onClick={() => toggleCategory("Seating")}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <CategoryIcon category="Seating" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-white/90">Seating</span>
            {expandedCategories.has("Seating") ? (
              <ChevronDown className="w-4 h-4 text-white/50" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/50" />
            )}
          </button>
          
          {expandedCategories.has("Seating") && (
            <div className="px-4 pb-3 space-y-2">
              {seatingProducts.map((product) => (
                <ProductItem key={product.id} product={product} onAdd={onAddProduct} />
              ))}
            </div>
          )}
        </div>

        {/* Illumination Category */}
        <div className="border-b border-white/10">
          <button 
            onClick={() => toggleCategory("Illumination")}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <CategoryIcon category="Illumination" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-white/90">Illumination</span>
            {expandedCategories.has("Illumination") ? (
              <ChevronDown className="w-4 h-4 text-white/50" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/50" />
            )}
          </button>
          
          {expandedCategories.has("Illumination") && (
            <div className="px-4 pb-3 space-y-2">
              {lightingProducts.map((product) => (
                <ProductItem key={product.id} product={product} onAdd={onAddProduct} />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const ProductItem = ({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) => {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="flex-1 text-sm text-white/80 truncate">{product.name}</span>
      <button 
        onClick={() => onAdd(product)}
        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Plus className="w-4 h-4 text-white/80" />
      </button>
    </div>
  );
};
