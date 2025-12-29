import { useState } from 'react';
import { Loader2, Sparkles, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SelectiveEditCreateProductProps {
  onProductGenerated: (imageUrl: string, description: string, category: string) => void;
  isDisabled?: boolean;
}

const CATEGORIES = [
  'Seating',
  'Tables',
  'Storage',
  'Lighting',
  'Decor',
  'Beds',
  'Outdoor',
  'Office',
  'Other'
];

export function SelectiveEditCreateProduct({ 
  onProductGenerated, 
  isDisabled 
}: SelectiveEditCreateProductProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({ title: 'Please enter a product description', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-furniture', {
        body: {
          prompt: description.trim(),
          category: category || 'Furniture',
        },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image generated');

      setGeneratedImageUrl(data.imageUrl);
      toast({ title: 'Product generated!', description: 'Click "Apply to Selection" to use it' });
    } catch (error) {
      console.error('Failed to generate product:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedImageUrl && !isApplying) {
      setIsApplying(true); // Prevent double-click
      onProductGenerated(generatedImageUrl, description, category || 'Furniture');
    }
  };

  const handleRegenerate = () => {
    setGeneratedImageUrl(null);
    handleGenerate();
  };

  return (
    <div className="space-y-3">
      {/* Description Input */}
      <div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the product you want to create... (e.g., 'Modern glass coffee table with gold legs')"
          disabled={isDisabled || isGenerating}
          className="min-h-[60px] resize-none text-sm"
        />
      </div>

      {/* Category Select */}
      <div className="flex gap-2">
        <Select value={category} onValueChange={setCategory} disabled={isDisabled || isGenerating}>
          <SelectTrigger className="flex-1 h-9 text-sm">
            <SelectValue placeholder="Category (optional)" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!generatedImageUrl && (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={isDisabled || isGenerating || !description.trim()}
            className="h-9 px-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        )}
      </div>

      {/* Generated Preview */}
      {generatedImageUrl && (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={generatedImageUrl}
              alt="Generated product"
              className="w-full h-32 object-contain bg-white"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={handleRegenerate}
                disabled={isDisabled || isGenerating}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
              </Button>
            </div>
          </div>
          
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={isDisabled || isGenerating || isApplying}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Apply to Selection
              </>
            )}
          </Button>
        </div>
      )}

      {/* Hint text when no image generated yet */}
      {!generatedImageUrl && !isGenerating && (
        <p className="text-xs text-muted-foreground text-center">
          AI will generate a product image that can be applied directly to your selection
        </p>
      )}
    </div>
  );
}
