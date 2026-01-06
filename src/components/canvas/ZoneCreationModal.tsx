import { useState, useCallback, useEffect } from 'react';
import { X, Loader2, Upload, Sparkles, Image as ImageIcon, RefreshCw, CheckCircle2, AlertCircle, Settings2, Palette, Home, Lightbulb, ArrowRight, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FurnitureSpecifier, FurnitureSpec } from './FurnitureSpecifier';
import { SnippedRegion } from './SnippingTool';

export interface ZoneConfiguration {
  name: string;
  zoneType: string;
  customZoneType?: string;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
  ceilingType: string;
  floorType: string;
  wallColor: string;
  windowCount: number;
  doorCount: number;
  naturalLight: 'low' | 'medium' | 'high';
  furniture: FurnitureSpec[];
  styleRefUrl?: string;
  guideUrl?: string;
  additionalPrompt: string;
  croppedImageDataUrl: string;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

interface ZoneCreationModalProps {
  snippedRegion: SnippedRegion;
  onGenerate: (config: ZoneConfiguration) => void;
  onReSnip: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

const ZONE_TYPES = [
  'Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom',
  'Entryway', 'Hallway', 'Closet', 'Laundry', 'Patio', 'Balcony', 'Custom'
];

const CEILING_TYPES = [
  'Flat', 'Tray', 'Coffered', 'Vaulted', 'Cathedral', 'Exposed Beam', 'Drop Ceiling'
];

const FLOOR_TYPES = [
  'Hardwood', 'Marble', 'Tile', 'Carpet', 'Concrete', 'Laminate', 'Vinyl', 'Stone'
];

const WALL_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Light Gray', hex: '#D3D3D3' },
  { name: 'Warm Beige', hex: '#D4C5A9' },
  { name: 'Sage Green', hex: '#9CAF88' },
  { name: 'Navy Blue', hex: '#1E3A5F' },
  { name: 'Terracotta', hex: '#C75B39' },
  { name: 'Charcoal', hex: '#36454F' },
];

export function ZoneCreationModal({
  snippedRegion,
  onGenerate,
  onReSnip,
  onCancel,
  isGenerating,
}: ZoneCreationModalProps) {
  // Form state
  const [name, setName] = useState('Zone 1');
  const [zoneType, setZoneType] = useState('Living Room');
  const [customZoneType, setCustomZoneType] = useState('');
  const [dimensions, setDimensions] = useState({ width: 15, length: 20, height: 10 });
  const [ceilingType, setCeilingType] = useState('Flat');
  const [floorType, setFloorType] = useState('Hardwood');
  const [wallColor, setWallColor] = useState('White');
  const [windowCount, setWindowCount] = useState(2);
  const [doorCount, setDoorCount] = useState(1);
  const [naturalLight, setNaturalLight] = useState<'low' | 'medium' | 'high'>('medium');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  
  // Furniture specs
  const [furnitureSpecs, setFurnitureSpecs] = useState<FurnitureSpec[]>([]);
  
  // AI Detection state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [detectedFurniture, setDetectedFurniture] = useState<Array<{ type: string; position?: string }>>([]);
  
  // Style/Guide uploads
  const [styleRefUrl, setStyleRefUrl] = useState<string | null>(null);
  const [guideUrl, setGuideUrl] = useState<string | null>(null);
  const [isUploadingStyle, setIsUploadingStyle] = useState(false);
  const [isUploadingGuide, setIsUploadingGuide] = useState(false);

  // Auto-analyze on mount
  useEffect(() => {
    handleAnalyze();
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-zone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          layoutZoneBase64: snippedRegion.croppedDataUrl,
          zoneName: name,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      
      if (data.success && data.analysis) {
        const analysis = data.analysis;
        
        // Update zone type if detected
        if (analysis.zoneType) {
          const matchedType = ZONE_TYPES.find(t => 
            analysis.zoneType.toLowerCase().includes(t.toLowerCase())
          );
          if (matchedType) {
            setZoneType(matchedType);
          }
        }
        
        // Update dimensions if estimated
        if (analysis.estimatedDimensions) {
          setDimensions(prev => ({
            ...prev,
            width: analysis.estimatedDimensions.widthFeet || prev.width,
            length: analysis.estimatedDimensions.depthFeet || prev.length,
          }));
        }
        
        // Extract detected furniture
        if (analysis.furniture && analysis.furniture.length > 0) {
          const furniture = analysis.furniture.map((f: { type: string; facingDirection?: string }) => ({
            type: f.type,
            position: f.facingDirection || 'Center',
          }));
          setDetectedFurniture(furniture);
        }
        
        setAnalysisComplete(true);
        toast.success(`Detected ${analysis.furniture?.length || 0} furniture items`);
      }
    } catch (err) {
      console.error('Zone analysis failed:', err);
      toast.error('Failed to analyze zone - you can still configure manually');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStyleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
      
      setStyleRefUrl(publicUrl);
      toast.success('Style reference uploaded');
    } catch (err) {
      toast.error('Failed to upload style reference');
    } finally {
      setIsUploadingStyle(false);
    }
  };

  const handleGuideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingGuide(true);
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
      toast.error('Failed to upload design guide');
    } finally {
      setIsUploadingGuide(false);
    }
  };

  const handleGenerate = () => {
    const config: ZoneConfiguration = {
      name,
      zoneType,
      customZoneType: zoneType === 'Custom' ? customZoneType : undefined,
      dimensions,
      ceilingType,
      floorType,
      wallColor,
      windowCount,
      doorCount,
      naturalLight,
      furniture: furnitureSpecs,
      styleRefUrl: styleRefUrl || undefined,
      guideUrl: guideUrl || undefined,
      additionalPrompt,
      croppedImageDataUrl: snippedRegion.croppedDataUrl,
      aspectRatio: snippedRegion.aspectRatio,
      orientation: snippedRegion.orientation,
    };
    
    onGenerate(config);
  };

  const selectedWallColor = WALL_COLORS.find(c => c.name === wallColor);

  return (
    <div className="fixed inset-0 z-50 bg-background flex animate-in fade-in duration-200">
      {/* Left side - Zone Preview */}
      <div className="flex-1 p-6 lg:p-8 flex flex-col min-w-0 border-r border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Configure Zone</h2>
              <p className="text-sm text-muted-foreground">
                {snippedRegion.pixelWidth} × {snippedRegion.pixelHeight} px • {snippedRegion.orientation}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onReSnip} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Re-snip
          </Button>
        </div>
        
        {/* Large preview */}
        <div className="flex-1 rounded-xl border border-border bg-muted/20 overflow-hidden flex items-center justify-center p-4">
          <img
            src={snippedRegion.croppedDataUrl}
            alt="Cropped zone"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
        
        {/* Analysis status */}
        <div className="mt-4 flex items-center gap-3">
          {isAnalyzing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing zone layout...</span>
            </div>
          ) : analysisComplete ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Analysis complete - detected {detectedFurniture.length} items</span>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleAnalyze} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Analyze Zone
            </Button>
          )}
        </div>
      </div>

      {/* Right side - Configuration */}
      <div className="w-full max-w-xl flex flex-col bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <span className="font-medium">Zone Configuration</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable config area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Zone Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Living Room"
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Zone Type</label>
                <Select value={zoneType} onValueChange={setZoneType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {zoneType === 'Custom' && (
              <Input
                value={customZoneType}
                onChange={(e) => setCustomZoneType(e.target.value)}
                placeholder="Enter custom zone type..."
                className="h-9"
              />
            )}
          </section>

          {/* Dimensions */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">Dimensions (feet)</h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Width</label>
                <Input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Length</label>
                <Input
                  type="number"
                  value={dimensions.length}
                  onChange={(e) => setDimensions(prev => ({ ...prev, length: Number(e.target.value) }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Height</label>
                <Input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                  className="h-9"
                />
              </div>
            </div>
          </section>

          {/* Architecture */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Architecture & Materials
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Ceiling</label>
                <Select value={ceilingType} onValueChange={setCeilingType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CEILING_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Floor</label>
                <Select value={floorType} onValueChange={setFloorType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOOR_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Wall Color</label>
              <div className="flex flex-wrap gap-2">
                {WALL_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setWallColor(color.name)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      wallColor === color.name ? "border-primary scale-110" : "border-transparent hover:border-muted-foreground/50"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{wallColor}</p>
            </div>
          </section>

          {/* Lighting */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              Lighting & Openings
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Windows: {windowCount}</label>
                <Slider
                  value={[windowCount]}
                  onValueChange={([v]) => setWindowCount(v)}
                  min={0}
                  max={6}
                  step={1}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Doors: {doorCount}</label>
                <Slider
                  value={[doorCount]}
                  onValueChange={([v]) => setDoorCount(v)}
                  min={0}
                  max={4}
                  step={1}
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Natural Light Level</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(level => (
                  <Button
                    key={level}
                    variant={naturalLight === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNaturalLight(level)}
                    className="flex-1 capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Furniture */}
          <section className="space-y-4">
            <FurnitureSpecifier
              detectedFurniture={detectedFurniture}
              onSpecsChange={setFurnitureSpecs}
            />
          </section>

          {/* Style & Guide */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Reference Images
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Style Reference */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Style Reference</label>
                {styleRefUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={styleRefUrl} alt="Style" className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => setStyleRefUrl(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    {isUploadingStyle ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleStyleUpload} />
                  </label>
                )}
              </div>
              
              {/* Design Guide */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Design Guide</label>
                {guideUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={guideUrl} alt="Guide" className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => setGuideUrl(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    {isUploadingGuide ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleGuideUpload} />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* Additional prompt */}
          <section className="space-y-2">
            <label className="text-xs text-muted-foreground">Additional Instructions (optional)</label>
            <Textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="e.g., Modern minimalist style with warm natural lighting..."
              className="min-h-[80px] resize-none"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !name.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Isometric View
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
