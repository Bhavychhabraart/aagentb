import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, Upload, Sparkles, Library, Loader2, Check, RefreshCw, Plus, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { cn } from '@/lib/utils';

interface MarkerProductSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFromCatalog: () => void;
  onProductSelected: (product: CatalogFurnitureItem) => void;
  markerId: string | null;
  customLibraryItems: CatalogFurnitureItem[];
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

export function MarkerProductSourceModal({
  isOpen,
  onClose,
  onSelectFromCatalog,
  onProductSelected,
  markerId,
  customLibraryItems,
}: MarkerProductSourceModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('catalog');
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // AI Generate state
  const [aiDescription, setAiDescription] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const resetUploadState = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadCategory('');
    setUploadPrice('');
  };

  const resetAIState = () => {
    setAiDescription('');
    setAiCategory('');
    setGeneratedImageUrl(null);
  };

  const handleClose = () => {
    resetUploadState();
    resetAIState();
    setActiveTab('catalog');
    onClose();
  };

  // Handle file selection for upload
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    // Auto-fill name from filename
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setUploadName(baseName);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // Upload product image and create CatalogFurnitureItem
  const handleUploadConfirm = async () => {
    if (!user || !uploadFile || !uploadName.trim()) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/marker-products/${Date.now()}-${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      const product: CatalogFurnitureItem = {
        id: `upload-${Date.now()}`,
        name: uploadName.trim(),
        category: uploadCategory || 'Other',
        price: uploadPrice ? parseFloat(uploadPrice) : 0,
        imageUrl: publicUrl,
        description: `Uploaded: ${uploadName.trim()}`,
      };

      onProductSelected(product);
      toast({ title: 'Product added to marker!' });
      handleClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  // Generate AI product
  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) {
      toast({ title: 'Please enter a description', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-furniture', {
        body: {
          prompt: aiDescription.trim(),
          category: aiCategory || 'Furniture',
        },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image generated');

      setGeneratedImageUrl(data.imageUrl);
      toast({ title: 'Product generated!', description: 'Click "Apply to Marker" to use it' });
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIApply = () => {
    if (!generatedImageUrl) return;

    const product: CatalogFurnitureItem = {
      id: `generated-${Date.now()}`,
      name: aiDescription.trim().substring(0, 50),
      category: aiCategory || 'Furniture',
      price: 0,
      imageUrl: generatedImageUrl,
      description: aiDescription.trim(),
    };

    onProductSelected(product);
    toast({ title: 'AI product applied to marker!' });
    handleClose();
  };

  // Select from custom library
  const handleLibrarySelect = (item: CatalogFurnitureItem) => {
    onProductSelected(item);
    toast({ title: 'Product applied to marker!' });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <VisuallyHidden.Root>
          <DialogTitle>Select Product for Marker</DialogTitle>
          <DialogDescription>Choose a product source for the selected marker</DialogDescription>
        </VisuallyHidden.Root>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Select Product Source</h2>
            <p className="text-sm text-muted-foreground">
              {markerId ? `Marker ${markerId.split('-').pop()}` : 'Choose how to add a product'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full rounded-none border-b border-border bg-background/50 h-12 p-0">
            <TabsTrigger value="catalog" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
              <Folder className="h-4 w-4" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
              <Sparkles className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1 gap-2 data-[state=active]:bg-primary/10">
              <Library className="h-4 w-4" />
              Library
            </TabsTrigger>
          </TabsList>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="m-0 p-5">
            <div className="text-center py-8">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Browse Product Catalog</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search through thousands of furniture items from our curated catalog
              </p>
              <Button onClick={onSelectFromCatalog} className="gap-2">
                <Folder className="h-4 w-4" />
                Open Catalog
              </Button>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="m-0 p-5 space-y-4">
            {!uploadPreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => document.getElementById('marker-product-upload')?.click()}
              >
                <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Drop image or click to upload</p>
                <p className="text-sm text-muted-foreground">Upload your own product image</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={uploadPreview} alt="Upload preview" className="w-full h-40 object-contain bg-muted" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={resetUploadState}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <Input
                  placeholder="Product name *"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
                
                <div className="flex gap-2">
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(e.target.value)}
                    className="w-28"
                  />
                </div>
                
                <Button 
                  onClick={handleUploadConfirm} 
                  disabled={isUploading || !uploadName.trim()}
                  className="w-full"
                >
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" />Apply to Marker</>
                  )}
                </Button>
              </div>
            )}
            
            <input
              id="marker-product-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </TabsContent>

          {/* Create with AI Tab */}
          <TabsContent value="create" className="m-0 p-5 space-y-4">
            <Textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe the product you want to create... (e.g., 'Modern glass coffee table with gold legs')"
              disabled={isGenerating}
              className="min-h-[80px] resize-none"
            />

            <div className="flex gap-2">
              <Select value={aiCategory} onValueChange={setAiCategory} disabled={isGenerating}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!generatedImageUrl && (
                <Button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiDescription.trim()}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Generate</>
                  )}
                </Button>
              )}
            </div>

            {generatedImageUrl && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={generatedImageUrl} alt="Generated product" className="w-full h-40 object-contain bg-white" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isGenerating && "animate-spin")} />
                  </Button>
                </div>
                
                <Button onClick={handleAIApply} className="w-full bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Apply to Marker
                </Button>
              </div>
            )}

            {!generatedImageUrl && !isGenerating && (
              <p className="text-xs text-muted-foreground text-center">
                AI will generate a product image that can be applied to your marker
              </p>
            )}
          </TabsContent>

          {/* Custom Library Tab */}
          <TabsContent value="library" className="m-0 p-0">
            <ScrollArea className="h-[300px]">
              {customLibraryItems.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 p-4">
                  {customLibraryItems.map((item) => (
                    <Card
                      key={item.id}
                      className="p-2 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleLibrarySelect(item)}
                    >
                      <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.category}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Library className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-1">No Custom Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Products you create or upload will appear here
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
