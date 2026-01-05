import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { supabase } from '@/integrations/supabase/client';
import { Search, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimilarProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogFurnitureItem | null;
  currentRenderUrl: string | null;
  catalogItems: CatalogFurnitureItem[];
  onSelect: (catalogItem: CatalogFurnitureItem) => void;
}

interface AnalysisResult {
  style: string;
  colors: string[];
  materials: string[];
  shape: string;
  size: string;
  searchTerms: string[];
  category: string;
  description: string;
}

export function SimilarProductsModal({
  open,
  onOpenChange,
  item,
  currentRenderUrl,
  catalogItems,
  onSelect,
}: SimilarProductsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<CatalogFurnitureItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogFurnitureItem | null>(null);

  useEffect(() => {
    if (open && item && currentRenderUrl) {
      analyzeAndFindSimilar();
    } else {
      setAnalysis(null);
      setFilteredProducts([]);
      setSelectedProduct(null);
    }
  }, [open, item, currentRenderUrl]);

  const analyzeAndFindSimilar = async () => {
    if (!item || !currentRenderUrl) return;

    setIsAnalyzing(true);
    try {
      // Call find-similar-furniture edge function
      const { data, error } = await supabase.functions.invoke('find-similar-furniture', {
        body: {
          roomImageUrl: currentRenderUrl,
          itemLabel: item.name,
        },
      });

      if (error) throw error;

      const analysisResult: AnalysisResult = {
        style: data.style || 'modern',
        colors: data.colors || [],
        materials: data.materials || [],
        shape: data.shape || '',
        size: data.size || 'standard',
        searchTerms: data.searchTerms || [],
        category: data.category || item.category,
        description: data.description || item.description || '',
      };

      setAnalysis(analysisResult);

      // Filter catalog items based on analysis
      const filtered = filterCatalogByAnalysis(catalogItems, analysisResult, item);
      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Failed to analyze item:', error);
      // Fallback: filter by category
      const fallbackFiltered = catalogItems.filter(
        (p) => p.category?.toLowerCase() === item.category?.toLowerCase()
      ).slice(0, 12);
      setFilteredProducts(fallbackFiltered);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filterCatalogByAnalysis = (
    catalog: CatalogFurnitureItem[],
    analysis: AnalysisResult,
    originalItem: CatalogFurnitureItem
  ): CatalogFurnitureItem[] => {
    // Score each catalog item based on analysis match
    const scored = catalog.map((item) => {
      let score = 0;
      const name = item.name.toLowerCase();
      const desc = (item.description || '').toLowerCase();

      // Category match (high weight)
      if (item.category?.toLowerCase() === analysis.category?.toLowerCase()) {
        score += 30;
      }

      // Search terms match
      for (const term of analysis.searchTerms) {
        if (name.includes(term.toLowerCase()) || desc.includes(term.toLowerCase())) {
          score += 10;
        }
      }

      // Style match
      if (name.includes(analysis.style.toLowerCase()) || desc.includes(analysis.style.toLowerCase())) {
        score += 15;
      }

      // Material match
      for (const material of analysis.materials) {
        if (desc.includes(material.toLowerCase())) {
          score += 8;
        }
      }

      // Color match
      for (const color of analysis.colors) {
        if (desc.includes(color.toLowerCase()) || name.includes(color.toLowerCase())) {
          score += 5;
        }
      }

      return { item, score };
    });

    // Sort by score and return top matches (exclude original item)
    return scored
      .filter((s) => s.item.id !== originalItem.id && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((s) => s.item);
  };

  const handleSelectProduct = () => {
    if (selectedProduct) {
      onSelect(selectedProduct);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Similar Products
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Original Item */}
          <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {item?.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{item?.name}</h3>
              <p className="text-sm text-muted-foreground">{item?.category}</p>
              
              {isAnalyzing && (
                <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing visual attributes...
                </div>
              )}
              
              {analysis && !isAnalyzing && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-xs">{analysis.style}</Badge>
                  {analysis.colors.slice(0, 2).map((color) => (
                    <Badge key={color} variant="outline" className="text-xs">{color}</Badge>
                  ))}
                  {analysis.materials.slice(0, 2).map((material) => (
                    <Badge key={material} variant="outline" className="text-xs">{material}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Similar Products Grid */}
          <div className="flex-1 min-h-0">
            <h4 className="text-sm font-medium mb-3">
              {isAnalyzing ? 'Searching catalog...' : `Similar Products (${filteredProducts.length})`}
            </h4>
            
            <ScrollArea className="h-[350px]">
              {isAnalyzing ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-square rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={cn(
                        'group text-left p-2 rounded-lg border transition-all hover:shadow-md',
                        selectedProduct?.id === product.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border/50 hover:border-primary/50'
                      )}
                    >
                      <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                        {selectedProduct?.id === product.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      {product.price && (
                        <p className="text-sm font-medium text-primary mt-1">
                          ₹{product.price.toLocaleString()}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No similar products found in catalog</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Try creating a custom product instead
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSelectProduct}
              disabled={!selectedProduct}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Use Selected Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
