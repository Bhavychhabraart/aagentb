import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Upload, Loader2, RefreshCw, Check, IndianRupee, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CustomFurnitureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onFurnitureCreated: (item: { name: string; imageUrl: string; category: string; price: number }) => void;
}

const CATEGORIES = [
  'Furniture',
  'Seating',
  'Tables',
  'Storage',
  'Beds',
  'Lighting',
  'Rugs',
  'Art',
  'Decor',
  'Tiles',
  'Bath Ware',
  'Vanity',
  'Wardrobe',
  'Kitchen',
  'Outdoor',
  'Office',
];

export function CustomFurnitureModal({
  open,
  onOpenChange,
  projectId,
  onFurnitureCreated,
}: CustomFurnitureModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onload = () => setReferencePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please describe the furniture piece.' });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-custom-furniture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          category: category || 'Furniture',
          referenceImageUrl: referencePreview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const { imageUrl } = await response.json();
      setGeneratedImage(imageUrl);
      toast({ title: 'Furniture generated!' });
    } catch (error) {
      console.error('Generation failed:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Generation failed', 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToProject = async () => {
    if (!user || !projectId || !generatedImage) return;

    setIsSaving(true);
    try {
      // Generate a name from the prompt
      const name = prompt.slice(0, 50).trim() || 'Custom Furniture';
      const price = parseFloat(estimatedPrice) || 0;

      // Save to staged_furniture
      const { error } = await supabase
        .from('staged_furniture')
        .insert({
          project_id: projectId,
          user_id: user.id,
          catalog_item_id: `custom-${Date.now()}`,
          item_name: name,
          item_category: category || 'Custom',
          item_description: prompt,
          item_image_url: generatedImage,
          item_price: price,
        });

      if (error) throw error;

      onFurnitureCreated({ name, imageUrl: generatedImage, category: category || 'Custom', price });
      
      // Reset form
      setPrompt('');
      setCategory('');
      setEstimatedPrice('');
      setReferenceImage(null);
      setReferencePreview(null);
      setGeneratedImage(null);
    } catch (error) {
      console.error('Failed to save furniture:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save furniture to project.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Custom Product Design
          </DialogTitle>
          <DialogDescription>
            Describe your ideal product and let AI generate it for you
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Description *</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Modern oak dining table with brass legs and minimalist design..."
                rows={3}
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Est. Price (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    placeholder="50000"
                    className="bg-secondary border-border pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Reference Image Upload */}
            <div className="space-y-2">
              <Label>Reference Image (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {referencePreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  <img 
                    src={referencePreview} 
                    alt="Reference" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => {
                      setReferenceImage(null);
                      setReferencePreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5" />
                  Upload Reference
                </Button>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4" />
                  Generate Product
                </>
              )}
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <Label>Generated Preview</Label>
            <div className={cn(
              'aspect-square rounded-lg border border-border overflow-hidden',
              'flex items-center justify-center bg-muted/50'
            )}>
              {isGenerating ? (
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Creating your furniture...</p>
                </div>
              ) : generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Generated Furniture" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Your generated furniture will appear here</p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
                <Button
                  onClick={handleSaveToProject}
                  disabled={isSaving || !projectId}
                  className="flex-1 gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Add to Project
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
