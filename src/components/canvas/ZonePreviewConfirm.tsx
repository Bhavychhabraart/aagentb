import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Upload, Plus, Sparkles, Image as ImageIcon, Maximize2, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cropRectangleFromImage } from '@/utils/cropZoneImage';
import { Zone } from './ZoneSelector';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Only isometric view - single view type for maximum accuracy
export type ViewType = 'isometric';

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
  
  // State for enhanced inputs
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
        console.log('=== ZONE PREVIEW LOADING ===');
        console.log('Zone:', zone.name);
        console.log('Layout URL:', layoutImageUrl.substring(0, 80) + '...');
        console.log('Zone coordinates (%):', { 
          x_start: zone.x_start.toFixed(2), 
          y_start: zone.y_start.toFixed(2), 
          x_end: zone.x_end.toFixed(2), 
          y_end: zone.y_end.toFixed(2),
          width: (zone.x_end - zone.x_start).toFixed(2),
          height: (zone.y_end - zone.y_start).toFixed(2),
        });
        
        // Validate bounds before cropping
        const width = zone.x_end - zone.x_start;
        const height = zone.y_end - zone.y_start;
        
        if (width <= 0 || height <= 0) {
          throw new Error(`Invalid zone dimensions: ${width.toFixed(1)}% x ${height.toFixed(1)}%`);
        }
        
        // Use optimized rectangle cropping with validated coordinates
        const cropped = await cropRectangleFromImage(layoutImageUrl, {
          x_start: zone.x_start,
          y_start: zone.y_start,
          x_end: zone.x_end,
          y_end: zone.y_end,
        });
        
        console.log('✓ Zone preview cropped successfully');
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
      viewType: 'isometric',
      styleRefUrls,
      selectedProducts,
      customPrompt,
    });
  };

  const zoneWidth = zone.x_end - zone.x_start;
  const zoneHeight = zone.y_end - zone.y_start;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex animate-in fade-in duration-200">
      {/* Left side - Large cropped preview */}
      <div className="flex-1 p-6 lg:p-10 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{zone.name}</h2>
            <p className="text-sm text-muted-foreground">
              Zone area: {zoneWidth.toFixed(0)}% × {zoneHeight.toFixed(0)}% of layout
            </p>
          </div>
        </div>
        
        {/* Large preview area */}
        <div className="flex-1 rounded-xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Cropping zone preview...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-destructive max-w-md text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="h-6 w-6" />
              </div>
              <p className="text-sm">{error}</p>
              <p className="text-xs text-muted-foreground">
                Try redrawing the zone on the layout
              </p>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={`2D Layout crop: ${zone.name}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : null}
        </div>

        {/* Zone coordinates info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary/50" />
            <span>Top-left: ({zone.x_start.toFixed(1)}%, {zone.y_start.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>Bottom-right: ({zone.x_end.toFixed(1)}%, {zone.y_end.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* Right side - Configuration panel */}
      <div className="w-full max-w-md border-l border-border bg-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-primary" />
            <span className="font-medium">Generate Isometric View</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
            disabled={isGenerating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable configuration area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Isometric View Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Grid3X3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Direct Gemini 3 Generation</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  The cropped zone will be sent directly to Gemini 3 Pro Image for accurate 2D-to-3D isometric conversion - the same method used for homepage generation.
                </p>
              </div>
            </div>
          </div>

          {/* Style Reference Section */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Style References
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {styleRefUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Style ref ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeStyleRef(index)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {styleRefUrls.length < 3 && (
                <label className="h-16 w-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-muted-foreground/50 transition-all">
                  {isUploadingStyle ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground mt-2">
              Upload images to match their aesthetic style and mood
            </p>
          </div>

          {/* Products Section */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-blue-500" />
              Products to Include
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <div key={product.id} className="relative group">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 pr-3 border border-border">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-medium truncate block max-w-[120px]">{product.name}</span>
                      <span className="text-[10px] text-muted-foreground">{product.category}</span>
                    </div>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowProductPicker(!showProductPicker)}
                className="h-14 px-4 border-2 border-dashed border-border rounded-lg flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/50 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
            
            {/* Product Picker Dropdown */}
            {showProductPicker && catalogItems.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto border border-border rounded-lg bg-background shadow-lg">
                <div className="p-2 border-b border-border bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Select from catalog</span>
                </div>
                <div className="grid grid-cols-1 gap-1 p-2">
                  {catalogItems.slice(0, 20).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleProductSelect(item);
                        setShowProductPicker(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left",
                        selectedProducts.find(p => p.id === item.id) && "bg-primary/10 border border-primary/30"
                      )}
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-cover rounded" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium truncate block">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {onOpenCatalog && (
                  <button
                    onClick={() => {
                      setShowProductPicker(false);
                      onOpenCatalog();
                    }}
                    className="w-full p-3 text-sm text-primary font-medium hover:bg-muted/50 border-t border-border"
                  >
                    Browse Full Catalog →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Instructions
              <span className="text-muted-foreground font-normal text-xs ml-1">(optional)</span>
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Modern minimalist with warm wood tones, soft natural lighting, Scandinavian aesthetic..."
              className="resize-none text-sm min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Describe the style, materials, lighting, or mood you want
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border bg-muted/20 space-y-3">
          {isGenerating && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Generating isometric view with Gemini 3...
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Converting 2D floor plan to photorealistic 3D render
              </p>
            </div>
          )}
          <Button
            className="w-full h-12"
            size="lg"
            onClick={handleConfirm}
            disabled={isLoading || !!error || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Grid3X3 className="h-5 w-5 mr-2" />
                Generate Isometric View
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
