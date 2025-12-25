import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, Upload, Loader2, IndianRupee, 
  X, History, FileText, Ruler, FolderOpen, 
  Layers, Tag, Maximize2, Box
} from 'lucide-react';
import { ProductImageEditor } from '@/components/creation/ProductImageEditor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BOMAnalysisPanel } from '@/components/creation/BOMAnalysisPanel';
import { CatalogPickerSection } from '@/components/creation/CatalogPickerSection';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { TechnicalDrawingPanel } from '@/components/creation/TechnicalDrawingPanel';
import { MaterialsPicker } from '@/components/creation/MaterialsPicker';
import { MATERIALS_LIBRARY } from '@/services/materialsLibrary';
import { WorkspaceHeader } from '@/components/creation/WorkspaceHeader';
import { FormSection } from '@/components/creation/FormSection';
import { PreviewCanvas } from '@/components/creation/PreviewCanvas';
import { CreationModeToggle } from '@/components/creation/CreationModeToggle';

const CATEGORIES = ['Furniture', 'Seating', 'Tables', 'Storage', 'Beds', 'Lighting', 'Rugs', 'Art', 'Decor', 'Tiles', 'Bath Ware', 'Vanity', 'Wardrobe', 'Kitchen', 'Outdoor', 'Office'];
const STYLES = ['Modern', 'Traditional', 'Minimalist', 'Industrial', 'Scandinavian', 'Bohemian', 'Art Deco', 'Mid-Century'];

interface GenerationHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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
  const [activeRightTab, setActiveRightTab] = useState('history');
  const [creationMode, setCreationMode] = useState<'scratch' | 'catalog'>('scratch');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogFurnitureItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);

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

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const getSelectedMaterialNames = () => {
    return selectedMaterials.map(id => {
      const material = MATERIALS_LIBRARY.find(m => m.id === id);
      return material?.name || id;
    });
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

  const handleModeChange = (mode: 'scratch' | 'catalog') => {
    setCreationMode(mode);
    if (mode === 'scratch') {
      setSelectedCatalogItem(null);
    }
  };

  const buildPrompt = () => {
    let fullPrompt = prompt;
    
    if (creationMode === 'catalog' && selectedCatalogItem) {
      fullPrompt = `Customize this ${selectedCatalogItem.category} item (${selectedCatalogItem.name}): ${prompt}`;
    }
    
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

    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a product name.' });
      return;
    }

    setIsSaving(true);
    try {
      const itemName = name.trim();
      const price = parseFloat(estimatedPrice) || 0;

      if (isEditing && editId) {
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

  const handleShare = () => {
    if (generatedImage) {
      navigator.clipboard.writeText(generatedImage);
      toast({ title: 'Link copied!', description: 'Image URL copied to clipboard.' });
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `${name || 'furniture'}-${Date.now()}.png`;
      link.click();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please log in to create custom furniture.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-subtle flex flex-col overflow-hidden">
      {/* Premium Header */}
      <WorkspaceHeader
        title={isEditing ? 'Edit Custom Product' : 'Create Custom Product'}
        subtitle="Design your ideal product with AI"
        isEditing={isEditing}
        isSaving={isSaving}
        canSave={!!generatedImage && !!selectedProjectId && !!name.trim()}
        onBack={() => navigate(-1)}
        onCancel={() => navigate('/custom-furniture')}
        onSave={handleSave}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Form with Collapsible Sections */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[360px] min-w-[320px] border-r border-border/50 flex flex-col bg-card/30 overflow-hidden"
        >
          <ScrollArea className="flex-1 min-h-0">
            <motion.div 
              className="p-3 space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {/* Creation Mode Toggle */}
              <motion.div variants={staggerItem}>
                <FormSection 
                  icon={Layers} 
                  title="Start From" 
                  collapsible={false}
                >
                  <CreationModeToggle 
                    mode={creationMode} 
                    onModeChange={handleModeChange}
                  />
                </FormSection>
              </motion.div>

              {/* Catalog Picker */}
              <AnimatePresence>
                {creationMode === 'catalog' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormSection icon={Box} title="Select Base Item">
                      <CatalogPickerSection
                        onSelect={handleCatalogItemSelect}
                        selectedItemId={selectedCatalogItem?.id || null}
                      />
                    </FormSection>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Project & Basic Info */}
              <motion.div variants={staggerItem}>
                <FormSection icon={FolderOpen} title="Basic Info">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Project</Label>
                      <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="glass-input h-10">
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
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Product Name *</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Modern Oak Dining Table"
                        className="glass-input h-10"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        {creationMode === 'catalog' ? 'Customization Details *' : 'Description *'}
                      </Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                          creationMode === 'catalog' && selectedCatalogItem
                            ? "Describe what you want to change..."
                            : "Describe your furniture in detail..."
                        }
                        rows={3}
                        className="glass-input resize-none"
                      />
                    </div>
                  </div>
                </FormSection>
              </motion.div>

              {/* Category & Price */}
              <motion.div variants={staggerItem}>
                <FormSection icon={Tag} title="Classification">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="glass-input h-10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Est. Price (₹)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={estimatedPrice}
                          onChange={(e) => setEstimatedPrice(e.target.value)}
                          placeholder="50000"
                          className="glass-input h-10 pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>
              </motion.div>

              {/* Materials */}
              <motion.div variants={staggerItem}>
                <FormSection 
                  icon={Palette} 
                  title="Materials" 
                  badge={selectedMaterials.length > 0 ? selectedMaterials.length : undefined}
                >
                  <MaterialsPicker
                    selectedMaterials={selectedMaterials}
                    onSelectionChange={setSelectedMaterials}
                    maxHeight="250px"
                  />
                </FormSection>
              </motion.div>

              {/* Styles */}
              <motion.div variants={staggerItem}>
                <FormSection 
                  icon={Layers} 
                  title="Style" 
                  badge={selectedStyles.length > 0 ? selectedStyles.length : undefined}
                >
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map(style => (
                      <Badge
                        key={style}
                        variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          selectedStyles.includes(style) 
                            ? "bg-primary hover:bg-primary/90" 
                            : "hover:border-primary/50 hover:bg-primary/5"
                        )}
                        onClick={() => toggleStyle(style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </FormSection>
              </motion.div>

              {/* Dimensions */}
              <motion.div variants={staggerItem}>
                <FormSection icon={Maximize2} title="Dimensions (cm)">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Width</Label>
                      <Input
                        type="number"
                        value={dimensions.width}
                        onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                        placeholder="W"
                        className="glass-input h-9 text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Depth</Label>
                      <Input
                        type="number"
                        value={dimensions.depth}
                        onChange={(e) => setDimensions(prev => ({ ...prev, depth: e.target.value }))}
                        placeholder="D"
                        className="glass-input h-9 text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Height</Label>
                      <Input
                        type="number"
                        value={dimensions.height}
                        onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="H"
                        className="glass-input h-9 text-center"
                      />
                    </div>
                  </div>
                </FormSection>
              </motion.div>

              {/* Reference Images */}
              <motion.div variants={staggerItem}>
                <FormSection 
                  icon={Upload} 
                  title="Reference Images" 
                  badge={referenceImages.length > 0 ? referenceImages.length : undefined}
                >
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
                        <motion.div 
                          key={index} 
                          className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <img src={img} alt="Reference" className="w-full h-full object-cover" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeReferenceImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      ))}
                      {referenceImages.length < 3 && (
                        <motion.button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload reference images</span>
                    </motion.button>
                  )}
                </FormSection>
              </motion.div>
            </motion.div>
          </ScrollArea>

          {/* Generate Button */}
          <div className="p-3 border-t border-border/50 glass shrink-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={cn(
                  "w-full gap-2 h-12 text-base font-medium rounded-xl",
                  !isGenerating && prompt.trim() && "btn-glow"
                )}
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
                    Generate Product
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Center - Preview Canvas */}
        <PreviewCanvas
          generatedImage={generatedImage}
          isGenerating={isGenerating}
          zoom={zoom}
          onZoomChange={setZoom}
          onRefine={() => setShowImageEditor(true)}
          onRegenerate={handleGenerate}
          onShare={handleShare}
          onDownload={handleDownload}
        />

        {/* Right Panel - History, BOM & Technical Drawings */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-72 min-w-[280px] border-l border-border/50 flex flex-col bg-card/30 overflow-hidden"
        >
          <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col h-full">
            {/* Pill-style Tabs */}
            <div className="p-3 border-b border-border/50">
              <TabsList className="grid grid-cols-3 h-10 p-1 bg-muted/30 rounded-xl">
                <TabsTrigger 
                  value="history" 
                  className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </TabsTrigger>
                <TabsTrigger 
                  value="bom" 
                  className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileText className="h-3.5 w-3.5" />
                  BOM
                </TabsTrigger>
                <TabsTrigger 
                  value="drawings" 
                  className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  Drawings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  <AnimatePresence>
                    {generationHistory.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <History className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">No history yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Generated images will appear here</p>
                      </motion.div>
                    ) : (
                      generationHistory.map((item, index) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => selectFromHistory(item)}
                          className={cn(
                            'w-full rounded-xl overflow-hidden border-2 transition-all duration-200',
                            'hover:shadow-lg hover:scale-[1.02]',
                            generatedImage === item.imageUrl
                              ? 'border-primary ring-2 ring-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
                              : 'border-border/50 hover:border-primary/50'
                          )}
                        >
                          <img 
                            src={item.imageUrl} 
                            alt="Generated" 
                            className="w-full aspect-square object-cover"
                          />
                          <div className="p-2.5 bg-muted/30 text-left">
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.prompt}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">
                              {item.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </AnimatePresence>
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
                  onClose={() => setActiveRightTab('history')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <FileText className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No BOM available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Generate furniture to see analysis</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="drawings" className="flex-1 m-0 overflow-hidden">
              {generatedImage ? (
                <TechnicalDrawingPanel
                  furnitureImage={generatedImage}
                  furnitureName={name || prompt.slice(0, 30) || 'Custom Furniture'}
                  dimensions={dimensions}
                  materials={selectedMaterials}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Ruler className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No drawings available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Generate furniture to create drawings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Product Image Editor */}
      {generatedImage && (
        <ProductImageEditor
          open={showImageEditor}
          onOpenChange={setShowImageEditor}
          imageUrl={generatedImage}
          productName={name || prompt.slice(0, 30) || 'Custom Furniture'}
          productCategory={category || 'Custom'}
          onSave={(newImageUrl) => {
            setGeneratedImage(newImageUrl);
            setGenerationHistory(prev => [{
              id: Date.now().toString(),
              imageUrl: newImageUrl,
              prompt: `Refined: ${prompt}`,
              timestamp: new Date(),
            }, ...prev].slice(0, 10));
          }}
        />
      )}
    </div>
  );
}
