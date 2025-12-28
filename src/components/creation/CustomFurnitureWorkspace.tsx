import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  ZoomIn, ZoomOut, X, History, Trash2, Maximize2, Share2, Download, Edit3, Ruler
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TechnicalDrawingPanel } from './TechnicalDrawingPanel';
import { MaterialsPicker } from './MaterialsPicker';
import { MATERIALS_LIBRARY } from '@/services/materialsLibrary';

interface CustomFurnitureItem {
  id: string;
  catalog_item_id: string;
  item_name: string;
  item_category: string;
  item_description: string | null;
  item_image_url: string | null;
  item_price: number | null;
  project_id: string;
}

interface CustomFurnitureWorkspaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: CustomFurnitureItem | null;
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIES = ['Seating', 'Tables', 'Storage', 'Lighting', 'Beds', 'Decor', 'Outdoor', 'Office'];
const STYLES = ['Modern', 'Traditional', 'Minimalist', 'Industrial', 'Scandinavian', 'Bohemian', 'Art Deco', 'Mid-Century'];

interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

export function CustomFurnitureWorkspace({
  open,
  onOpenChange,
  editingItem,
  onClose,
  onSave,
}: CustomFurnitureWorkspaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [customMaterial, setCustomMaterial] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: '', depth: '', height: '' });
  const [colors, setColors] = useState<string[]>(['#8B4513', '#F5F5DC']);

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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Edit refinement state
  const [isRefining, setIsRefining] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.item_name);
      setPrompt(editingItem.item_description || '');
      setCategory(editingItem.item_category);
      setEstimatedPrice(editingItem.item_price?.toString() || '');
      setGeneratedImage(editingItem.item_image_url);
      setSelectedProjectId(editingItem.project_id);
    } else {
      resetForm();
    }
  }, [editingItem]);

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

  const resetForm = () => {
    setName('');
    setPrompt('');
    setCategory('');
    setEstimatedPrice('');
    setSelectedMaterials([]);
    setCustomMaterial('');
    setSelectedStyles([]);
    setDimensions({ width: '', depth: '', height: '' });
    setReferenceImages([]);
    setGeneratedImage(null);
    setGenerationHistory([]);
    setZoom(100);
    setRefinementPrompt('');
  };

  const addCustomMaterial = () => {
    if (customMaterial.trim() && !selectedMaterials.includes(customMaterial.trim())) {
      setSelectedMaterials(prev => [...prev, customMaterial.trim()]);
      setCustomMaterial('');
    }
  };

  const handleRefinement = async () => {
    if (!generatedImage || !refinementPrompt.trim()) return;
    
    setIsRefining(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-custom-furniture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: `${prompt}. Refinement: ${refinementPrompt}`,
          category: category || 'Furniture',
          referenceImageUrl: generatedImage,
        }),
      });

      if (!response.ok) throw new Error('Refinement failed');
      
      const { imageUrl } = await response.json();
      setGeneratedImage(imageUrl);
      
      // Add to history
      setGenerationHistory(prev => [{
        id: Date.now().toString(),
        imageUrl,
        prompt: `Refined: ${refinementPrompt}`,
        timestamp: new Date(),
      }, ...prev].slice(0, 10));
      
      setRefinementPrompt('');
      toast({ title: 'Furniture refined!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Refinement failed' });
    } finally {
      setIsRefining(false);
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;
    
    try {
      await navigator.clipboard.writeText(generatedImage);
      toast({ title: 'Link copied!', description: 'Image URL copied to clipboard' });
    } catch {
      // Fallback: open in new tab
      window.open(generatedImage, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = formatDownloadFilename('customlibrary', name || 'furniture', 'png');
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded!' });
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
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

  // Get material names from selected IDs for prompt building
  const getSelectedMaterialNames = () => {
    return selectedMaterials.map(id => {
      const material = MATERIALS_LIBRARY.find(m => m.id === id);
      return material?.name || id;
    });
  };

  const buildPrompt = () => {
    let fullPrompt = prompt;
    
    const materialNames = getSelectedMaterialNames();
    if (materialNames.length > 0) {
      fullPrompt += ` Materials: ${materialNames.join(', ')}.`;
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

      if (editingItem) {
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
          .eq('id', editingItem.id);

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

      onSave();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Custom Furniture' : 'Create Custom Furniture'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Design your ideal furniture piece with AI
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Input Form */}
            <div className="w-96 border-r border-border flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
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
                    <Label>Description *</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your furniture in detail... e.g., Modern oak dining table with brass legs and minimalist design, seats 6 people"
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
                    <Label>Materials (100+ options)</Label>
                    <MaterialsPicker
                      selectedMaterials={selectedMaterials}
                      onSelectionChange={setSelectedMaterials}
                      maxHeight="250px"
                    />
                  </div>

                  {/* Styles */}
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {STYLES.map(style => (
                        <Badge
                          key={style}
                          variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                          className="cursor-pointer"
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
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-20 border-dashed gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-5 w-5" />
                        Upload References
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

            {/* Center Panel - Preview Canvas */}
            <div className="flex-1 flex flex-col bg-muted/20">
              {/* Zoom Controls */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(50, z - 25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {generatedImage && (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating || isRefining} className="gap-1.5">
                        <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                        Regenerate
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <div 
                  className={cn(
                    'bg-card border border-border rounded-xl overflow-hidden shadow-lg transition-transform',
                    'max-w-3xl w-full aspect-square'
                  )}
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                      <p className="text-lg text-muted-foreground">Creating your furniture...</p>
                    </div>
                  ) : generatedImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={generatedImage} 
                        alt="Generated Furniture" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-24 w-24 mb-4 opacity-30" />
                      <p className="text-lg">Your generated furniture will appear here</p>
                      <p className="text-sm mt-2">Fill in the details and click Generate</p>
                    </div>
                  )}
                </div>
                
                {/* Refinement Input */}
                {generatedImage && (
                  <div className="mt-4 w-full max-w-md">
                    <div className="flex gap-2">
                      <Input
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="Refine: e.g., 'make legs thinner' or 'add brass accents'"
                        className="flex-1"
                        disabled={isRefining}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefinement()}
                      />
                      <Button 
                        onClick={handleRefinement} 
                        disabled={isRefining || !refinementPrompt.trim()}
                        className="gap-2"
                      >
                        {isRefining ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Edit3 className="h-4 w-4" />
                        )}
                        Refine
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Edit the generated furniture with text prompts
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - History & Drawings Tabs */}
            <div className="w-72 border-l border-border flex flex-col">
              <Tabs defaultValue="history" className="flex flex-col h-full">
                <div className="px-4 py-2 border-b border-border">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history" className="text-xs gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="drawings" className="text-xs gap-1.5">
                      <Ruler className="h-3.5 w-3.5" />
                      Drawings
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    {generationHistory.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No generations yet</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-2">
                        {generationHistory.map(item => (
                          <button
                            key={item.id}
                            onClick={() => selectFromHistory(item)}
                            className={cn(
                              'w-full rounded-lg overflow-hidden border-2 transition-colors',
                              generatedImage === item.imageUrl 
                                ? 'border-primary' 
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <img 
                              src={item.imageUrl} 
                              alt="Generation" 
                              className="w-full aspect-square object-cover"
                            />
                            <div className="p-2 text-left bg-card">
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.prompt}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {item.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="drawings" className="flex-1 m-0 overflow-hidden">
                  <TechnicalDrawingPanel
                    furnitureImage={generatedImage}
                    furnitureName={name || 'Custom Furniture'}
                    dimensions={dimensions}
                    materials={selectedMaterials}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
