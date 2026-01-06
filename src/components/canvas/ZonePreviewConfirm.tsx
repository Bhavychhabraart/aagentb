import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Upload, Plus, Sparkles, Image as ImageIcon, Maximize2, Grid3X3, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
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

// Zone analysis types
interface FurnitureAnalysis {
  type: string;
  shape: 'rectangular' | 'circular' | 'L-shaped' | 'irregular';
  centerX: number;
  centerY: number;
  widthPercent: number;
  heightPercent: number;
  rotationDegrees: number;
  facingDirection: string;
  estimatedRealSize: string;
}

interface ArchitecturalFeature {
  type: 'window' | 'door' | 'opening' | 'column' | 'stairs';
  wall: 'top' | 'bottom' | 'left' | 'right' | 'center';
  positionPercent: number;
  widthPercent: number;
}

export interface ZoneAnalysis {
  zoneType: string;
  estimatedDimensions: {
    widthFeet: number;
    depthFeet: number;
    aspectRatio: string;
  };
  furniture: FurnitureAnalysis[];
  architecturalFeatures: ArchitecturalFeature[];
  spatialRelationships: string[];
  sceneDescription: string;
}

export interface ZoneGenerationOptions {
  viewType: ViewType;
  styleRefUrls: string[];
  selectedProducts: CatalogFurnitureItem[];
  customPrompt: string;
  preAnalysis?: ZoneAnalysis;
  guideUrl?: string;
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

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<ZoneAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showFurnitureDetails, setShowFurnitureDetails] = useState(true);

  // Guide state
  const [guideUrl, setGuideUrl] = useState<string | null>(null);
  const [isUploadingGuide, setIsUploadingGuide] = useState(false);
  
  // Style/Guide analysis state
  const [styleAnalysis, setStyleAnalysis] = useState<string | null>(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [guideAnalysis, setGuideAnalysis] = useState<string | null>(null);
  const [isAnalyzingGuide, setIsAnalyzingGuide] = useState(false);

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

  // Analyze zone when preview is ready
  const handleAnalyzeZone = useCallback(async () => {
    if (!previewUrl) {
      toast.error('Preview not ready yet');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisError('Analysis timed out. Please try again.');
      toast.error('Analysis timed out after 60 seconds');
    }, 60000);

    try {
      console.log('=== CALLING ZONE ANALYSIS ===');
      console.log('Preview URL length:', previewUrl.length);
      console.log('Guide URL:', guideUrl || 'none');
      
      // Convert guide URL to base64 if present
      let guideBase64: string | undefined;
      if (guideUrl) {
        try {
          const guideResponse = await fetch(guideUrl);
          const guideBlob = await guideResponse.blob();
          guideBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(guideBlob);
          });
        } catch (guideErr) {
          console.warn('Failed to convert guide to base64:', guideErr);
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-zone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          layoutZoneBase64: previewUrl,
          zoneName: zone.name,
          guideBase64,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Analysis failed (${response.status})`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Analysis response:', data);
      
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        console.log('Zone analysis complete:', data.analysis);
        toast.success(`Detected ${data.analysis.furniture?.length || 0} furniture items`);
      } else {
        throw new Error(data.error || 'Analysis returned no results');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Zone analysis failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setAnalysisError(errorMsg);
      toast.error(`Analysis failed: ${errorMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [previewUrl, zone.name, guideUrl]);

  // Handle guide upload
  const handleGuideUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingGuide(true);
    setGuideAnalysis(null); // Reset analysis when uploading new guide
    try {
      const fileName = `guides/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);
      
      setGuideUrl(publicUrl);
      toast.success('Design guide uploaded');
    } catch (err) {
      console.error('Guide upload failed:', err);
      toast.error('Failed to upload design guide');
    } finally {
      setIsUploadingGuide(false);
    }
  }, []);

  // Analyze guide image
  const handleAnalyzeGuide = useCallback(async () => {
    if (!guideUrl) return;
    
    setIsAnalyzingGuide(true);
    try {
      // Convert guide URL to base64
      const response = await fetch(guideUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const analysisResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-zone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          layoutZoneBase64: base64,
          zoneName: 'Design Guide Analysis',
          analysisType: 'guide',
        }),
      });
      
      if (!analysisResponse.ok) throw new Error('Guide analysis failed');
      
      const data = await analysisResponse.json();
      if (data.guideInsights) {
        setGuideAnalysis(data.guideInsights);
        toast.success('Guide analyzed');
      } else if (data.analysis?.sceneDescription) {
        setGuideAnalysis(data.analysis.sceneDescription);
        toast.success('Guide analyzed');
      }
    } catch (err) {
      console.error('Guide analysis failed:', err);
      toast.error('Failed to analyze guide');
    } finally {
      setIsAnalyzingGuide(false);
    }
  }, [guideUrl]);

  // Analyze style references
  const handleAnalyzeStyle = useCallback(async () => {
    if (styleRefUrls.length === 0) return;
    
    setIsAnalyzingStyle(true);
    try {
      // Convert first style ref to base64
      const response = await fetch(styleRefUrls[0]);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const analysisResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-zone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          layoutZoneBase64: base64,
          zoneName: 'Style Reference Analysis',
          analysisType: 'style',
        }),
      });
      
      if (!analysisResponse.ok) throw new Error('Style analysis failed');
      
      const data = await analysisResponse.json();
      if (data.styleInsights) {
        setStyleAnalysis(data.styleInsights);
        toast.success('Style analyzed');
      } else if (data.analysis?.sceneDescription) {
        setStyleAnalysis(data.analysis.sceneDescription);
        toast.success('Style analyzed');
      }
    } catch (err) {
      console.error('Style analysis failed:', err);
      toast.error('Failed to analyze style');
    } finally {
      setIsAnalyzingStyle(false);
    }
  }, [styleRefUrls]);

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
    // Pass preAnalysis and guideUrl if available
    onConfirm({
      viewType: 'isometric',
      styleRefUrls,
      selectedProducts,
      customPrompt,
      preAnalysis: analysisResult || undefined,
      guideUrl: guideUrl || undefined,
    });
  };

  const zoneWidth = zone.x_end - zone.x_start;
  const zoneHeight = zone.y_end - zone.y_start;

  // Format zone type for display
  const formatZoneType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
          
          {/* STEP 1: Analyze Zone Section */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/30 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                  analysisResult ? "bg-green-500/20 text-green-600" : "bg-primary/20 text-primary"
                )}>
                  {analysisResult ? <CheckCircle2 className="h-4 w-4" /> : "1"}
                </div>
                <span className="font-medium text-sm">Analyze Zone</span>
              </div>
              {!analysisResult && !isAnalyzing && previewUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyzeZone}
                  className="h-7 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Analyze
                </Button>
              )}
              {analysisResult && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAnalyzeZone}
                  disabled={isAnalyzing}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", isAnalyzing && "animate-spin")} />
                  Re-analyze
                </Button>
              )}
            </div>

            {/* Analysis Status/Results */}
            <div className="p-3">
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>AI analyzing floor plan layout...</span>
                </div>
              ) : analysisError ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{analysisError}</span>
                </div>
              ) : analysisResult ? (
                <div className="space-y-3">
                  {/* Zone Type & Dimensions */}
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                      {formatZoneType(analysisResult.zoneType)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ~{analysisResult.estimatedDimensions.widthFeet}ft × {analysisResult.estimatedDimensions.depthFeet}ft
                    </span>
                  </div>

                  {/* Furniture List */}
                  {analysisResult.furniture.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowFurnitureDetails(!showFurnitureDetails)}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
                      >
                        {showFurnitureDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Detected Furniture ({analysisResult.furniture.length} items)
                      </button>
                      
                      {showFurnitureDetails && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {analysisResult.furniture.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium capitalize">{item.type.replace(/_/g, ' ')}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({item.centerX.toFixed(0)}%, {item.centerY.toFixed(0)}%)
                                </span>
                              </div>
                              <span className="text-muted-foreground shrink-0">{item.estimatedRealSize}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Architectural Features */}
                  {analysisResult.architecturalFeatures.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Features: </span>
                      {analysisResult.architecturalFeatures.map(f => 
                        `${f.type} (${f.wall} wall)`
                      ).join(', ')}
                    </div>
                  )}

                  {/* Scene Description */}
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 italic">
                    "{analysisResult.sceneDescription}"
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click "Analyze" to detect furniture and layout from the floor plan. This helps generate more accurate results.
                </p>
              )}
            </div>
          </div>

          {/* Design Guide Section */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                Design Guide
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </span>
              {guideUrl && !guideAnalysis && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyzeGuide}
                  disabled={isAnalyzingGuide}
                  className="h-6 text-xs px-2"
                >
                  {isAnalyzingGuide ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Analyze
                </Button>
              )}
            </label>
            <div className="flex items-start gap-3">
              {guideUrl ? (
                <div className="relative group">
                  <img
                    src={guideUrl}
                    alt="Design guide"
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => { setGuideUrl(null); setGuideAnalysis(null); }}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="h-20 w-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-muted-foreground/50 transition-all">
                  {isUploadingGuide ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Guide</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGuideUpload}
                    disabled={isUploadingGuide}
                  />
                </label>
              )}
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Upload a design guide to help the AI understand layout patterns and design rules.
                </p>
                {guideAnalysis && (
                  <div className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded p-2 italic">
                    "{guideAnalysis}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Isometric View Info */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Grid3X3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Isometric 3D Projection</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  The zone will be rendered as a precise isometric view, converting the 2D floor plan to a photorealistic 3D visualization with maximum layout accuracy.
                </p>
              </div>
            </div>
          </div>

          {/* Style Reference Section */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Style References
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </span>
              {styleRefUrls.length > 0 && !styleAnalysis && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyzeStyle}
                  disabled={isAnalyzingStyle}
                  className="h-6 text-xs px-2"
                >
                  {isAnalyzingStyle ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Analyze
                </Button>
              )}
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
                    onClick={() => { removeStyleRef(index); setStyleAnalysis(null); }}
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
            {styleAnalysis && (
              <div className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded p-2 mt-2 italic">
                "{styleAnalysis}"
              </div>
            )}
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
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  {analysisResult ? 'Generating with pre-analyzed layout...' : 'Processing zone...'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    analysisResult ? "bg-green-500" : "bg-primary animate-pulse"
                  )} />
                  <span className={analysisResult ? "line-through opacity-50" : ""}>
                    Stage 1: AI analyzing floor plan layout
                  </span>
                  {analysisResult && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    analysisResult ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                  )} />
                  <span>Stage 2: Building precise placement prompt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  <span>Stage 3: Generating isometric render</span>
                </div>
              </div>
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
                {analysisResult && (
                  <span className="ml-2 text-xs opacity-70">(analyzed)</span>
                )}
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
