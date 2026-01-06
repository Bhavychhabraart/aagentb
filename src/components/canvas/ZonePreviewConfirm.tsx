import { useState, useEffect, useCallback } from 'react';
import { X, Camera, Loader2, Upload, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cropRectangleFromImage } from '@/utils/cropZoneImage';
import { Zone } from './ZoneSelector';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ViewType = 'detail' | 'cinematic' | 'eye-level' | 'dramatic' | 'bird-eye';

const viewTypeOptions: { value: ViewType; label: string; description: string }[] = [
  { value: 'detail', label: 'Detail', description: 'Close-up focus' },
  { value: 'cinematic', label: 'Cinematic', description: 'Wide dramatic' },
  { value: 'eye-level', label: 'Eye Level', description: 'Standing view' },
  { value: 'dramatic', label: 'Dramatic', description: 'Low angle' },
  { value: 'bird-eye', label: 'Bird Eye', description: 'Top-down' },
];

export interface ZoneGenerationOptions {
  viewType: ViewType;
  styleRefUrls: string[];
  selectedProducts: CatalogFurnitureItem[];
  customPrompt: string;
}

interface ZonePreviewConfirmProps {
  zone: Zone;
  layoutImageUrl: string;
  onConfirm: (options: ZoneGenerationOptions) => void;
  onCancel: () => void;
  isGenerating: boolean;
  existingStyleRefs?: string[];
  catalogItems?: CatalogFurnitureItem[];
  onOpenCatalog?: () => void;
}

export function ZonePreviewConfirm({
  zone,
  layoutImageUrl,
  onConfirm,
  onCancel,
  isGenerating,
  existingStyleRefs = [],
  catalogItems = [],
  onOpenCatalog,
}: ZonePreviewConfirmProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewType, setSelectedViewType] = useState<ViewType>('detail');
  
  // New state for enhanced inputs
  const [styleRefUrls, setStyleRefUrls] = useState<string[]>(existingStyleRefs);
  const [selectedProducts, setSelectedProducts] = useState<CatalogFurnitureItem[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isUploadingStyle, setIsUploadingStyle] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Loading zone preview:', zone.name);
        console.log('Zone bounds:', { 
          x_start: zone.x_start, 
          y_start: zone.y_start, 
          x_end: zone.x_end, 
          y_end: zone.y_end 
        });
        
        // Validate bounds before cropping
        const width = zone.x_end - zone.x_start;
        const height = zone.y_end - zone.y_start;
        
        if (width <= 0 || height <= 0) {
          throw new Error(`Invalid zone dimensions: ${width.toFixed(1)}% x ${height.toFixed(1)}%`);
        }
        
        // Use optimized rectangle cropping with clamped coordinates
        const cropped = await cropRectangleFromImage(layoutImageUrl, {
          x_start: zone.x_start,
          y_start: zone.y_start,
          x_end: zone.x_end,
          y_end: zone.y_end,
        });
        
        console.log('Cropped image generated successfully');
        setPreviewUrl(cropped);
      } catch (err) {
        console.error('Failed to crop zone preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [zone, layoutImageUrl]);

  const handleStyleRefUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (styleRefUrls.length >= 3) {
      toast.error('Maximum 3 style references allowed');
      return;
    }
    
    setIsUploadingStyle(true);
    try {
      const fileName = `style-refs/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);
      
      setStyleRefUrls(prev => [...prev, publicUrl]);
      toast.success('Style reference added');
    } catch (err) {
      console.error('Style upload failed:', err);
      toast.error('Failed to upload style reference');
    } finally {
      setIsUploadingStyle(false);
    }
  }, [styleRefUrls.length]);

  const removeStyleRef = (index: number) => {
    setStyleRefUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (product: CatalogFurnitureItem) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleConfirm = () => {
    onConfirm({
      viewType: selectedViewType,
      styleRefUrls,
      selectedProducts,
      customPrompt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
          <div>
            <h3 className="text-sm font-semibold">Generate Zone View</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure how this zone will be rendered
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCancel}
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Preview area */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Zone Preview</label>
            <div className="rounded-lg border border-border/50 overflow-hidden bg-muted/30 aspect-video flex items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs">Loading preview...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <span className="text-xs">{error}</span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Preview of zone: ${zone.name}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{zone.name}</span>
              <span>
                {`${(zone.x_end - zone.x_start).toFixed(0)}% × ${(zone.y_end - zone.y_start).toFixed(0)}%`}
              </span>
            </div>
          </div>

          {/* View Type Selection */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">View Type</label>
            <div className="grid grid-cols-5 gap-1">
              {viewTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedViewType(option.value)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg border text-center transition-all",
                    selectedViewType === option.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="text-[10px] font-medium leading-tight">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Reference Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Style References
              <span className="text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {styleRefUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Style ref ${index + 1}`}
                    className="h-14 w-14 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeStyleRef(index)}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {styleRefUrls.length < 3 && (
                <label className="h-14 w-14 border border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  {isUploadingStyle ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleStyleRefUpload}
                    disabled={isUploadingStyle}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Upload images to match their aesthetic style
            </p>
          </div>

          {/* Products Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Products to Include
              <span className="text-muted-foreground/60 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <div key={product.id} className="relative group">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1.5 pr-3 border border-border">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-8 w-8 object-cover rounded"
                      />
                    )}
                    <span className="text-xs truncate max-w-[100px]">{product.name}</span>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="h-10 px-3 border border-dashed border-border rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Product
              </button>
            </div>
            
            {/* Product Picker Dropdown */}
            {showProductPicker && catalogItems.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-border rounded-lg bg-background">
                <div className="grid grid-cols-2 gap-1 p-1">
                  {catalogItems.slice(0, 12).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleProductSelect(item);
                        setShowProductPicker(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors text-left",
                        selectedProducts.find(p => p.id === item.id) && "bg-primary/10"
                      )}
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="h-6 w-6 object-cover rounded" />
                      )}
                      <span className="text-[10px] truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
                {onOpenCatalog && (
                  <button
                    onClick={() => {
                      setShowProductPicker(false);
                      onOpenCatalog();
                    }}
                    className="w-full p-2 text-xs text-primary hover:bg-muted/50 border-t border-border"
                  >
                    Browse Full Catalog →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Additional Instructions
              <span className="text-muted-foreground/60 font-normal ml-1">(optional)</span>
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Modern minimalist with warm wood tones, soft natural lighting..."
              className="resize-none text-xs h-16"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-border/50 bg-muted/20 shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading || !!error || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Generate View
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
