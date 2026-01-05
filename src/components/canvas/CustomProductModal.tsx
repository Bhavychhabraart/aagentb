import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Package, Ruler, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogFurnitureItem | null;
  currentRenderUrl: string | null;
  projectId: string | null;
  renderId: string | null;
  onProductCreated: (customProduct: CustomProductSpec) => void;
}

export interface CustomProductSpec {
  id: string;
  name: string;
  category: string;
  description: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
    unit: string;
  };
  materials: Record<string, string>;
  manufacturing?: {
    estimated_hours?: number;
    skill_level?: string;
    special_requirements?: string[];
  };
  pricing: {
    budget: { price: number; materials: string };
    standard: { price: number; materials: string };
    premium: { price: number; materials: string };
  };
  position_x?: number;
  position_y?: number;
  source_image_url?: string;
}

type PricingTier = 'budget' | 'standard' | 'premium';

const TIER_INFO: Record<PricingTier, { label: string; description: string; color: string }> = {
  budget: {
    label: 'Budget',
    description: 'Cost-effective materials',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  },
  standard: {
    label: 'Standard',
    description: 'Quality mainstream materials',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  premium: {
    label: 'Premium',
    description: 'Luxury high-end materials',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
};

export function CustomProductModal({
  open,
  onOpenChange,
  item,
  currentRenderUrl,
  projectId,
  renderId,
  onProductCreated,
}: CustomProductModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customProduct, setCustomProduct] = useState<CustomProductSpec | null>(null);
  const [selectedTier, setSelectedTier] = useState<PricingTier>('standard');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && item && currentRenderUrl) {
      generateCustomProduct();
    } else {
      setCustomProduct(null);
      setSelectedTier('standard');
    }
  }, [open, item, currentRenderUrl]);

  const generateCustomProduct = async () => {
    if (!currentRenderUrl) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          action: 'create_custom',
          renderUrl: currentRenderUrl,
        },
      });

      if (error) throw error;

      // Find the custom product that best matches the selected item
      const products = data.custom_products || [];
      let matchedProduct = products[0];

      if (item && products.length > 1) {
        // Try to find a product matching the category
        const categoryMatch = products.find(
          (p: any) => p.category?.toLowerCase() === item.category?.toLowerCase()
        );
        if (categoryMatch) {
          matchedProduct = categoryMatch;
        }
      }

      if (matchedProduct) {
        const spec: CustomProductSpec = {
          id: `custom_${Date.now()}`,
          name: matchedProduct.name || item?.name || 'Custom Furniture',
          category: matchedProduct.category || item?.category || 'Furniture',
          description: matchedProduct.description || '',
          dimensions: matchedProduct.dimensions || { width: 100, depth: 50, height: 80, unit: 'cm' },
          materials: matchedProduct.materials || {},
          manufacturing: matchedProduct.manufacturing,
          pricing: matchedProduct.pricing || {
            budget: { price: 25000, materials: 'MDF, Polyester' },
            standard: { price: 45000, materials: 'Plywood, Cotton-Linen' },
            premium: { price: 85000, materials: 'Solid Wood, Leather' },
          },
          position_x: matchedProduct.position_x,
          position_y: matchedProduct.position_y,
          source_image_url: currentRenderUrl,
        };
        setCustomProduct(spec);
      }
    } catch (error) {
      console.error('Failed to generate custom product:', error);
      // Create a fallback based on the original item
      if (item) {
        setCustomProduct({
          id: `custom_${Date.now()}`,
          name: `Custom ${item.name}`,
          category: item.category,
          description: item.description || 'Custom designed furniture piece',
          dimensions: { width: 100, depth: 60, height: 80, unit: 'cm' },
          materials: { frame: 'Wood', upholstery: 'Fabric' },
          pricing: {
            budget: { price: Math.round((item.price || 20000) * 0.7), materials: 'MDF, Polyester blend' },
            standard: { price: item.price || 20000, materials: 'Plywood, Cotton-Linen' },
            premium: { price: Math.round((item.price || 20000) * 1.8), materials: 'Solid hardwood, Leather' },
          },
          source_image_url: currentRenderUrl || undefined,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToQuote = async () => {
    if (!customProduct || !projectId) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to custom_products table
      const { error } = await supabase.from('custom_products').insert({
        user_id: user.id,
        project_id: projectId,
        render_id: renderId,
        name: customProduct.name,
        category: customProduct.category,
        description: customProduct.description,
        dimensions: customProduct.dimensions,
        materials: customProduct.materials,
        manufacturing: customProduct.manufacturing || null,
        pricing: customProduct.pricing,
        source_image_url: customProduct.source_image_url,
        position_x: customProduct.position_x,
        position_y: customProduct.position_y,
      });

      if (error) throw error;

      onProductCreated(customProduct);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save custom product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Create Custom Product
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing and generating specifications...</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Creating detailed product specs with tiered pricing
              </p>
            </div>
          ) : customProduct ? (
            <div className="space-y-6 py-2">
              {/* Product Header */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item?.imageUrl ? (
                    <img src={item.imageUrl} alt={customProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{customProduct.name}</h3>
                  <Badge variant="secondary" className="mt-1">{customProduct.category}</Badge>
                  <p className="text-sm text-muted-foreground mt-2">{customProduct.description}</p>
                </div>
              </div>

              {/* Dimensions */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Dimensions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-semibold">{customProduct.dimensions.width}</p>
                      <p className="text-xs text-muted-foreground">Width ({customProduct.dimensions.unit})</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{customProduct.dimensions.depth}</p>
                      <p className="text-xs text-muted-foreground">Depth ({customProduct.dimensions.unit})</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{customProduct.dimensions.height}</p>
                      <p className="text-xs text-muted-foreground">Height ({customProduct.dimensions.unit})</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Materials</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(customProduct.materials).map(([part, material]) => (
                      <Badge key={part} variant="outline" className="text-sm">
                        <span className="text-muted-foreground mr-1">{part}:</span> {material}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Tiers */}
              <div>
                <h4 className="font-medium mb-3">Select Pricing Tier</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(TIER_INFO) as PricingTier[]).map((tier) => {
                    const tierData = customProduct.pricing[tier];
                    const info = TIER_INFO[tier];
                    const isSelected = selectedTier === tier;

                    return (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 transition-all text-left',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <Badge className={cn('mb-2', info.color)}>{info.label}</Badge>
                        <p className="text-2xl font-bold mb-1">₹{tierData.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{tierData.materials}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manufacturing Notes */}
              {customProduct.manufacturing && (
                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                  <p className="font-medium mb-1">Manufacturing Notes</p>
                  <p className="text-muted-foreground">
                    Estimated {customProduct.manufacturing.estimated_hours || 20} hours • 
                    {' '}{customProduct.manufacturing.skill_level || 'Expert'} craftsmanship
                  </p>
                  {customProduct.manufacturing.special_requirements && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {customProduct.manufacturing.special_requirements.map((req) => (
                        <Badge key={req} variant="outline" className="text-xs">{req}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Failed to generate product specifications</p>
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToQuote}
            disabled={!customProduct || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Add to Quote ({selectedTier})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
