import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, Upload, Loader2, RefreshCw, Check, IndianRupee, ImageIcon, 
  ZoomIn, ZoomOut, X, History, ArrowLeft, Sparkles, FileText, Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BOMAnalysisPanel } from '@/components/creation/BOMAnalysisPanel';
import { CatalogPickerSection } from '@/components/creation/CatalogPickerSection';
import { CatalogFurnitureItem } from '@/services/catalogService';

const CATEGORIES = ['Seating', 'Tables', 'Storage', 'Lighting', 'Beds', 'Decor', 'Outdoor', 'Office'];
const MATERIALS = ['Wood', 'Metal', 'Fabric', 'Leather', 'Glass', 'Marble', 'Rattan', 'Velvet'];
const STYLES = ['Modern', 'Traditional', 'Minimalist', 'Industrial', 'Scandinavian', 'Bohemian', 'Art Deco', 'Mid-Century'];

interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

export default function CreateCustomFurniture() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const projectIdParam = searchParams.get('projectId');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: '', depth: '', height: '' });

  // Reference images
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  
  // Generated images
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || '');
  const [activeRightTab, setActiveRightTab] = useState('preview');
  const [creationMode, setCreationMode] = useState<'scratch' | 'catalog'>('scratch');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogFurnitureItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (editId) {
        loadEditingItem(editId);
      }
    }
  }, [user, editId]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .order('updated_at', { ascending: false });
    
    if (data) {
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    }
  };

  const loadEditingItem = async (id: string) => {
    const { data } = await supabase
      .from('staged_furniture')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setIsEditing(true);
      setName(data.item_name);
      setPrompt(data.item_description || '');
      setCategory(data.item_category);
      setEstimatedPrice(data.item_price?.toString() || '');
      setGeneratedImage(data.item_image_url);
      setSelectedProjectId(data.project_id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev => 
      prev.includes(material) 
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleCatalogItemSelect = (item: CatalogFurnitureItem) => {
    setSelectedCatalogItem(item);
    setName(`${item.name} (Custom)`);
    setCategory(CATEGORIES.find(c => c.toLowerCase() === item.category.toLowerCase()) || item.category);
    setEstimatedPrice(item.price?.toString() || '');
    if (item.imageUrl) {
      setReferenceImages([item.imageUrl]);
    }
    setPrompt('');
  };

  const buildPrompt = () => {
    let fullPrompt = prompt;
    
    // Add context for catalog-based customization
    if (creationMode === 'catalog' && selectedCatalogItem) {
      fullPrompt = `Customize this ${selectedCatalogItem.category} item (${selectedCatalogItem.name}): ${prompt}`;
    }
    
    if (selectedMaterials.length > 0) {
      fullPrompt += ` Materials: ${selectedMaterials.join(', ')}.`;
    }
    if (selectedStyles.length > 0) {
      fullPrompt += ` Style: ${selectedStyles.join(', ')}.`;
    }
    if (dimensions.width || dimensions.depth || dimensions.height) {
      const dims = [];
      if (dimensions.width) dims.push(`W:${dimensions.width}cm`);
      if (dimensions.depth) dims.push(`D:${dimensions.depth}cm`);
      if (dimensions.height) dims.push(`H:${dimensions.height}cm`);
      fullPrompt += ` Dimensions: ${dims.join(' x ')}.`;
    }
    
    return fullPrompt.trim();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please describe the furniture piece.' });
      return;
    }

    setIsGenerating(true);

    try {
      const fullPrompt = buildPrompt();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-custom-furniture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          category: category || 'Furniture',
          referenceImageUrl: referenceImages[0] || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const { imageUrl } = await response.json();
      setGeneratedImage(imageUrl);
      
      // Add to history
      setGenerationHistory(prev => [{
        id: Date.now().toString(),
        imageUrl,
        prompt: fullPrompt,
        timestamp: new Date(),
      }, ...prev].slice(0, 10));
      
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

  const handleSave = async () => {
    if (!user || !selectedProjectId || !generatedImage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a project and generate an image.' });
      return;
    }

    setIsSaving(true);
    try {
      const itemName = name.trim() || prompt.slice(0, 50).trim() || 'Custom Furniture';
      const price = parseFloat(estimatedPrice) || 0;

      if (isEditing && editId) {
        // Update existing item
        const { error } = await supabase
          .from('staged_furniture')
          .update({
            item_name: itemName,
            item_category: category || 'Custom',
            item_description: prompt,
            item_image_url: generatedImage,
            item_price: price,
          })
          .eq('id', editId);

        if (error) throw error;
        toast({ title: 'Updated!', description: 'Custom furniture updated successfully.' });
      } else {
        // Create new item
        const { error } = await supabase
          .from('staged_furniture')
          .insert({
            project_id: selectedProjectId,
            user_id: user.id,
            catalog_item_id: `custom-${Date.now()}`,
            item_name: itemName,
            item_category: category || 'Custom',
            item_description: prompt,
            item_image_url: generatedImage,
            item_price: price,
          });

        if (error) throw error;
        toast({ title: 'Saved!', description: 'Custom furniture added to library.' });
      }

      navigate('/custom-furniture');
    } catch (error) {
      console.error('Failed to save:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save furniture.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectFromHistory = (item: GenerationHistoryItem) => {
    setGeneratedImage(item.imageUrl);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please log in to create custom furniture.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditing ? 'Edit Custom Furniture' : 'Create Custom Furniture'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Design your ideal furniture piece with AI
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/custom-furniture')}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !generatedImage || !selectedProjectId}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {isEditing ? 'Update' : 'Save to Library'}
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input Form */}
        <div className="w-[400px] border-r border-border flex flex-col bg-card/50">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Creation Mode Toggle */}
              <div className="space-y-2">
                <Label>Start From</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCreationMode('scratch');
                      setSelectedCatalogItem(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      creationMode === 'scratch'
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Sparkles className={cn("h-6 w-6", creationMode === 'scratch' ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="text-sm font-medium">From Scratch</p>
                      <p className="text-xs text-muted-foreground">Describe your ideal piece</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setCreationMode('catalog')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      creationMode === 'catalog'
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Package className={cn("h-6 w-6", creationMode === 'catalog' ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="text-sm font-medium">From Catalog</p>
                      <p className="text-xs text-muted-foreground">Pick & customize</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Catalog Picker (shown when catalog mode selected) */}
              {creationMode === 'catalog' && (
                <div className="space-y-2">
                  <Label>Select Base Item</Label>
                  <CatalogPickerSection
                    onSelect={handleCatalogItemSelect}
                    selectedItemId={selectedCatalogItem?.id || null}
                  />
                </div>
              )}

              {/* Project Selection */}
              <div className="space-y-2">
                <Label>Save to Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>Name (Optional)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Modern Oak Dining Table"
                  className="bg-muted/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>{creationMode === 'catalog' ? 'Customization Details *' : 'Description *'}</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    creationMode === 'catalog' && selectedCatalogItem
                      ? `Describe what you want to change... e.g., Change color to navy blue, use leather instead of fabric, make it smaller`
                      : "Describe your furniture in detail... e.g., Modern oak dining table with brass legs and minimalist design, seats 6 people"
                  }
                  rows={4}
                  className="bg-muted/50"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Est. Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={estimatedPrice}
                      onChange={(e) => setEstimatedPrice(e.target.value)}
                      placeholder="50000"
                      className="bg-muted/50 pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <Label>Materials</Label>
                <div className="flex flex-wrap gap-2">
                  {MATERIALS.map(material => (
                    <Badge
                      key={material}
                      variant={selectedMaterials.includes(material) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleMaterial(material)}
                    >
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Styles */}
              <div className="space-y-2">
                <Label>Style</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(style => (
                    <Badge
                      key={style}
                      variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleStyle(style)}
                    >
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label>Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="Width"
                    className="bg-muted/50"
                  />
                  <Input
                    type="number"
                    value={dimensions.depth}
                    onChange={(e) => setDimensions(prev => ({ ...prev, depth: e.target.value }))}
                    placeholder="Depth"
                    className="bg-muted/50"
                  />
                  <Input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="Height"
                    className="bg-muted/50"
                  />
                </div>
              </div>

              {/* Reference Images */}
              <div className="space-y-2">
                <Label>Reference Images</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {referenceImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {referenceImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={img} alt="Reference" className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeReferenceImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {referenceImages.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-20 border-dashed gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5" />
                    Upload Reference Images
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Generate Button */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Palette className="h-5 w-5" />
                  Generate Furniture
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Center - Preview Canvas */}
        <div className="flex-1 flex flex-col bg-muted/30">
          {/* Zoom Controls */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(prev => Math.max(25, prev - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(prev => Math.min(200, prev + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            {generatedImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                Regenerate
              </Button>
            )}
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div 
              className={cn(
                'rounded-xl border border-border overflow-hidden bg-card shadow-lg transition-all',
                'flex items-center justify-center'
              )}
              style={{ 
                width: `${Math.min(600, 600 * (zoom / 100))}px`,
                height: `${Math.min(600, 600 * (zoom / 100))}px`,
              }}
            >
              {isGenerating ? (
                <div className="text-center p-8">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Creating your furniture...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
                </div>
              ) : generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Generated Furniture" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-muted-foreground">Preview Area</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Describe your furniture and click Generate
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - History & BOM */}
        <div className="w-80 border-l border-border flex flex-col bg-card/50">
          <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col h-full">
            <TabsList className="grid grid-cols-2 m-4">
              <TabsTrigger value="preview" className="gap-1">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="bom" className="gap-1">
                <FileText className="h-4 w-4" />
                BOM
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {generationHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No generation history yet</p>
                    </div>
                  ) : (
                    generationHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => selectFromHistory(item)}
                        className={cn(
                          'w-full rounded-lg overflow-hidden border-2 transition-all',
                          generatedImage === item.imageUrl
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <img 
                          src={item.imageUrl} 
                          alt="Generated" 
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-2 bg-muted/50 text-left">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.prompt}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {item.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bom" className="flex-1 m-0 overflow-hidden">
              {generatedImage ? (
                <BOMAnalysisPanel
                  item={{
                    id: editId || 'new',
                    item_name: name || prompt.slice(0, 30) || 'Custom Furniture',
                    item_category: category || 'Custom',
                    item_description: prompt,
                    item_image_url: generatedImage,
                    item_price: parseFloat(estimatedPrice) || null,
                  }}
                  onClose={() => setActiveRightTab('preview')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Generate furniture to see BOM analysis</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}