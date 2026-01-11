import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { PlacedProduct } from '@/types/wizard';

interface ProductCarouselProps {
  products: PlacedProduct[];
  activeProductId?: string;
  onProductClick: (productId: string) => void;
}

export function ProductCarousel({
  products,
  activeProductId,
  onProductClick,
}: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    slidesToScroll: 1,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Scroll to active product
  useEffect(() => {
    if (!emblaApi || !activeProductId) return;
    const index = products.findIndex(p => p.id === activeProductId);
    if (index !== -1) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, activeProductId, products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-4">
        <h3 className="text-lg font-semibold">Products in This Design</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 px-6">
          {products.map((product, index) => {
            const isActive = product.id === activeProductId;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex-none w-64 cursor-pointer transition-all duration-300
                  ${isActive ? 'scale-105' : 'hover:scale-102'}
                `}
                onClick={() => onProductClick(product.id)}
              >
                <div className={`
                  bg-card rounded-2xl border-2 overflow-hidden shadow-lg
                  ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                `}>
                  {/* Image */}
                  <div className="relative aspect-square bg-muted/30">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          {product.isCustom ? (
                            <Sparkles className="w-6 h-6 text-primary" />
                          ) : (
                            <span className="text-2xl">🪑</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Custom Badge */}
                    {product.isCustom && (
                      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Custom
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                      <Button variant="secondary" size="sm" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </Button>
                    </motion.div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    {product.price && (
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Gradient Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}
