import { useState, useRef } from 'react';
import { Upload, X, Loader2, Palette, Globe, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CustomMaterialUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MATERIAL_CATEGORIES = [
  'Boards',
  'Stone',
  'Metal',
  'Glass',
  'Fabrics',
  'Leather',
  'Veneers',
  'Laminates',
  'Tiles',
  'Custom'
];

const MATERIAL_PROPERTIES = [
  { id: 'waterResistant', label: 'Water Resistant' },
  { id: 'scratchResistant', label: 'Scratch Resistant' },
  { id: 'heatResistant', label: 'Heat Resistant' },
  { id: 'ecoFriendly', label: 'Eco Friendly' },
  { id: 'antimicrobial', label: 'Antimicrobial' },
  { id: 'fireRetardant', label: 'Fire Retardant' }
];

export function CustomMaterialUploader({ open, onOpenChange, onSuccess }: CustomMaterialUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState('#8B7355');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select an image file.' });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(p => p !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSubmit = async () => {
    if (!user || !name.trim() || !imageFile) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all required fields.' });
      return;
    }

    setIsUploading(true);
    try {
      // Upload image to storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('custom-materials')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('custom-materials')
        .getPublicUrl(fileName);

      // Create material record
      const { error: insertError } = await supabase
        .from('custom_materials')
        .insert({
          user_id: user.id,
          name: name.trim(),
          category,
          subcategory: subcategory.trim() || null,
          description: description.trim() || null,
          image_url: publicUrl,
          color_hex: colorHex,
          is_public: isPublic,
          properties: selectedProperties.reduce((acc, prop) => ({ ...acc, [prop]: true }), {})
        });

      if (insertError) throw insertError;

      toast({ title: 'Material uploaded!', description: 'Your custom material has been added to the library.' });
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to upload material:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Failed to upload material. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCategory('Custom');
    setSubcategory('');
    setDescription('');
    setColorHex('#8B7355');
    setIsPublic(false);
    setSelectedProperties([]);
    setImageFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Custom Material</DialogTitle>
          <DialogDescription>
            Add your own material textures to use in custom furniture
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Material Texture *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full aspect-square max-w-[200px] rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square max-w-[200px] rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/30 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Material Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Italian Marble White"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g., Carrara"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the material properties and best uses..."
              rows={2}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Dominant Color
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <Input
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-28 font-mono text-sm"
              />
            </div>
          </div>

          {/* Properties */}
          <div className="space-y-2">
            <Label>Properties</Label>
            <div className="grid grid-cols-2 gap-2">
              {MATERIAL_PROPERTIES.map(prop => (
                <div key={prop.id} className="flex items-center gap-2">
                  <Checkbox
                    id={prop.id}
                    checked={selectedProperties.includes(prop.id)}
                    onCheckedChange={() => handlePropertyToggle(prop.id)}
                  />
                  <label htmlFor={prop.id} className="text-sm cursor-pointer">
                    {prop.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Share with community</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Others can use this material' : 'Only you can use this material'}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || !name.trim() || !imageFile}
            className="w-full gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Material
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
