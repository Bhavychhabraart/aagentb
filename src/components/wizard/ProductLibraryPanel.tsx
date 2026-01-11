import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Sparkles, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PRODUCT_CATEGORIES } from '@/types/wizard';

interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  dimensions: { width: number; depth: number; height: number };
}

interface ProductLibraryPanelProps {
  onProductSelect: (product: CatalogProduct) => void;
  onCreateCustom: () => void;
}

// Mock catalog products - in production this would come from the database
const MOCK_PRODUCTS: CatalogProduct[] = [
  { id: '1', name: '3-Seater Sofa', category: 'Seating', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200', price: 85000, dimensions: { width: 220, depth: 90, height: 85 } },
  { id: '2', name: 'Accent Chair', category: 'Seating', imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=200', price: 32000, dimensions: { width: 75, depth: 80, height: 90 } },
  { id: '3', name: 'Coffee Table', category: 'Tables', imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=200', price: 28000, dimensions: { width: 120, depth: 60, height: 45 } },
  { id: '4', name: 'Dining Table', category: 'Tables', imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=200', price: 65000, dimensions: { width: 180, depth: 90, height: 75 } },
  { id: '5', name: 'Floor Lamp', category: 'Lighting', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200', price: 12000, dimensions: { width: 40, depth: 40, height: 160 } },
  { id: '6', name: 'Bookshelf', category: 'Storage', imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=200', price: 45000, dimensions: { width: 100, depth: 35, height: 200 } },
  { id: '7', name: 'TV Console', category: 'Storage', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', price: 38000, dimensions: { width: 180, depth: 45, height: 55 } },
  { id: '8', name: 'Area Rug', category: 'Rugs', imageUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=200', price: 25000, dimensions: { width: 200, depth: 300, height: 2 } },
  { id: '9', name: 'Pendant Light', category: 'Lighting', imageUrl: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200', price: 8500, dimensions: { width: 45, depth: 45, height: 30 } },
  { id: '10', name: 'Side Table', category: 'Tables', imageUrl: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?w=200', price: 15000, dimensions: { width: 50, depth: 50, height: 55 } },
];

export function ProductLibraryPanel({ onProductSelect, onCreateCustom }: ProductLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['Seating', 'Tables']);

  const filteredProducts = MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const productsByCategory = PRODUCT_CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredProducts.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, CatalogProduct[]>);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <h3 className="font-semibold text-sm">Product Library</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Create Custom Button */}
        <Button
          variant="outline"
          className="w-full gap-2 text-sm"
          onClick={onCreateCustom}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Create Custom Product
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-3">
          <TabsTrigger value="catalog" className="text-xs">Catalog</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="p-2 space-y-1">
              {PRODUCT_CATEGORIES.map((category) => {
                const products = productsByCategory[category];
                if (products.length === 0) return null;

                return (
                  <Collapsible
                    key={category}
                    open={openCategories.includes(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{products.length}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openCategories.includes(category) ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-[0.98] transition-transform"
                            draggable
                            onDragStart={(e: React.DragEvent) => {
                              e.dataTransfer.setData('product', JSON.stringify(product));
                            }}
                            onClick={() => onProductSelect(product)}
                          >
                            <div className="bg-muted/30 rounded-lg p-2 border border-border/50 hover:border-primary/50 transition-colors">
                              <div className="aspect-square rounded-md overflow-hidden bg-background mb-2">
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs font-medium truncate">{product.name}</p>
                              <p className="text-xs text-primary">{formatPrice(product.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="custom" className="flex-1">
          <div className="p-4 text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No custom products yet</p>
            <Button variant="link" size="sm" onClick={onCreateCustom}>
              Create your first custom product
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="flex-1">
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No saved products</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
