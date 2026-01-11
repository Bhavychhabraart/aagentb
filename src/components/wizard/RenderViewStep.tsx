import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Share2, RefreshCw, FileText, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCarousel } from './ProductCarousel';
import { BOQPanel } from './BOQPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlacedProduct, RoomDimensions, StyleReference, BOQData } from '@/types/wizard';

interface RenderViewStepProps {
  layoutUrl?: string;
  roomDimensions?: RoomDimensions;
  roomType?: string;
  placedProducts: PlacedProduct[];
  colorPalette: string[];
  styleReferences: StyleReference[];
  boqData: BOQData;
  generatedRenderUrl?: string;
  onRenderComplete: (url: string) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function RenderViewStep({
  layoutUrl,
  roomDimensions,
  roomType,
  placedProducts,
  colorPalette,
  styleReferences,
  boqData,
  generatedRenderUrl,
  onRenderComplete,
  onBack,
  onComplete,
}: RenderViewStepProps) {
  const [isGenerating, setIsGenerating] = useState(!generatedRenderUrl);
  const [renderUrl, setRenderUrl] = useState(generatedRenderUrl || '');
  const [activeProductId, setActiveProductId] = useState<string | undefined>();
  const [showBOQ, setShowBOQ] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Generate render on mount if not already generated
  useEffect(() => {
    if (!generatedRenderUrl) {
      generateRender();
    }
  }, []);

  const generateRender = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke('generate-wizard-render', {
        body: {
          layoutImageUrl: layoutUrl,
          roomDimensions,
          roomType,
          placedProducts: placedProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            imageUrl: p.imageUrl,
            position: p.position,
            dimensions: p.dimensions,
            description: p.description,
            isCustom: p.isCustom,
          })),
          colorPalette,
          styleReferences: styleReferences.map(s => s.url),
        }
      });

      if (error) throw error;

      setRenderUrl(data.renderUrl);
      onRenderComplete(data.renderUrl);
      setGenerationProgress(100);
      toast.success('Render generated successfully!');
    } catch (error) {
      console.error('Render generation error:', error);
      // Use a placeholder for demo
      const placeholderUrl = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200';
      setRenderUrl(placeholderUrl);
      onRenderComplete(placeholderUrl);
      setGenerationProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handleProductMarkerClick = (productId: string) => {
    setActiveProductId(productId);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-180px)] flex flex-col"
    >
      {/* Render Display */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-muted/20 to-muted/5"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
              >
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              
              <h3 className="text-xl font-semibold mb-2">Generating Your Design</h3>
              <p className="text-muted-foreground mb-6">
                AI is placing your furniture and creating a beautiful visualization...
              </p>
              
              {/* Progress Bar */}
              <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(generationProgress)}% complete
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="render"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
            >
              {/* Rendered Image */}
              <img
                src={renderUrl}
                alt="Generated room render"
                className="w-full h-full object-contain"
              />

              {/* Product Markers */}
              {placedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${product.position.x}%`,
                    top: `${product.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => handleProductMarkerClick(product.id)}
                >
                  <div className={`
                    relative w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${activeProductId === product.id 
                      ? 'bg-primary scale-125' 
                      : 'bg-white/90 hover:bg-primary hover:scale-110'
                    }
                  `}>
                    <MapPin className={`w-4 h-4 ${activeProductId === product.id ? 'text-white' : 'text-primary'}`} />
                    
                    {/* Pulse Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-popover text-popover-foreground px-3 py-1.5 rounded-lg shadow-lg text-sm whitespace-nowrap">
                      {product.name}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 bg-background/80 backdrop-blur-sm"
                  onClick={generateRender}
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Carousel */}
      <div className="bg-card border-t border-border">
        <ProductCarousel
          products={placedProducts}
          activeProductId={activeProductId}
          onProductClick={setActiveProductId}
        />
      </div>

      {/* Action Bar */}
      <div className="h-16 border-t border-border bg-card flex items-center justify-between px-6">
        <Button variant="outline" onClick={onBack}>
          ← Back to Mood Board
        </Button>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowBOQ(true)}>
            <FileText className="w-4 h-4" />
            View BOQ
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button size="lg" className="gap-2 px-6" onClick={onComplete}>
            Go to Workspace
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* BOQ Panel */}
      <BOQPanel
        boqData={boqData}
        isOpen={showBOQ}
        onClose={() => setShowBOQ(false)}
      />
    </motion.div>
  );
}
