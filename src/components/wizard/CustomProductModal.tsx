import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Upload, Loader2, RefreshCw, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRODUCT_CATEGORIES } from '@/types/wizard';
import type { CustomProduct } from '@/types/wizard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: CustomProduct) => void;
}

export function CustomProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: CustomProductModalProps) {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Seating');
  const [dimensions, setDimensions] = useState({ width: 100, depth: 80, height: 85 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<{ min: number; max: number } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your product');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-furniture', {
        body: {
          prompt,
          category,
          dimensions,
        }
      });

      if (error) throw error;

      setGeneratedImage(data.imageUrl);
      setEstimatedPrice(data.estimatedPrice || { min: 20000, max: 50000 });
      toast.success('Product generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      // Mock response for demo
      setGeneratedImage('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400');
      setEstimatedPrice({ min: 45000, max: 75000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToMoodBoard = () => {
    if (!generatedImage || !estimatedPrice) return;

    const product: CustomProduct = {
      id: crypto.randomUUID(),
      name: prompt.slice(0, 50),
      category,
      description: prompt,
      prompt,
      imageUrl: generatedImage,
      estimatedPrice,
      dimensions,
      generatedAt: new Date().toISOString(),
    };

    onProductCreated(product);
    onClose();
    resetForm();
    toast.success('Product added to mood board!');
  };

  const resetForm = () => {
    setPrompt('');
    setCategory('Seating');
    setDimensions({ width: 100, depth: 80, height: 85 });
    setGeneratedImage(null);
    setEstimatedPrice(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Custom Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>Describe your ideal product</Label>
            <Textarea
              placeholder="Modern oak dining table with brass legs, seats 6 people, minimalist Scandinavian design..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dimensions (cm)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="W"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(d => ({ ...d, width: +e.target.value }))}
                  className="text-center"
                />
                <Input
                  type="number"
                  placeholder="D"
                  value={dimensions.depth}
                  onChange={(e) => setDimensions(d => ({ ...d, depth: +e.target.value }))}
                  className="text-center"
                />
                <Input
                  type="number"
                  placeholder="H"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(d => ({ ...d, height: +e.target.value }))}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <Label>Reference Images (Optional)</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button variant="outline" size="sm">
                From Catalog
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </Button>

          {/* Generated Preview */}
          <AnimatePresence>
            {generatedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary/20">
                  <img
                    src={generatedImage}
                    alt="Generated product"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={handleGenerate}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>

                {/* Estimated Price */}
                {estimatedPrice && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">Estimated Price Range</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(estimatedPrice.min)} - {formatPrice(estimatedPrice.max)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Final price depends on materials and specifications
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setGeneratedImage(null)} className="flex-1">
                    Start Over
                  </Button>
                  <Button onClick={handleAddToMoodBoard} className="flex-1 gap-2">
                    <Check className="w-4 h-4" />
                    Add to Mood Board
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
