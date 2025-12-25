import { useState, useCallback } from 'react';
import { X, Loader2, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SelectiveEditUploaderProps {
  selectedImages: string[];
  onImagesChange: (imageUrls: string[]) => void;
  maxImages?: number;
}

export function SelectiveEditUploader({ 
  selectedImages, 
  onImagesChange,
  maxImages = 5
}: SelectiveEditUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not signed in',
        description: 'Please sign in to upload images.',
      });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file.',
      });
      return;
    }

    if (selectedImages.length >= maxImages) {
      toast({
        variant: 'destructive',
        title: 'Maximum images reached',
        description: `You can only upload up to ${maxImages} reference images.`,
      });
      return;
    }

    setIsUploading(true);
    try {
      // Sanitize filename - remove special characters
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/selective-edit/${Date.now()}-${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);

      onImagesChange([...selectedImages, publicUrl]);
      
      toast({
        title: 'Image uploaded',
        description: `Reference image ${selectedImages.length + 1} added.`,
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, selectedImages, onImagesChange, toast, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    // Upload only the first file to prevent overwhelming
    const file = files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const canAddMore = selectedImages.length < maxImages;

  return (
    <div className="space-y-3">
      {/* Uploaded Images Grid */}
      {selectedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {selectedImages.map((imageUrl, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden border border-border group">
              <img
                src={imageUrl}
                alt={`Reference ${index + 1}`}
                className="w-full h-20 object-cover bg-muted"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                {index + 1}
              </div>
            </div>
          ))}
          
          {/* Add more button if under limit */}
          {canAddMore && !isUploading && (
            <div
              onClick={() => document.getElementById('selective-edit-upload')?.click()}
              className="flex items-center justify-center h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Upload area when no images yet */}
      {selectedImages.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            isUploading && "pointer-events-none opacity-60"
          )}
          onClick={() => document.getElementById('selective-edit-upload')?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs font-medium text-foreground mb-1">
                Drop image or click to upload
              </p>
              <p className="text-[10px] text-muted-foreground">
                Upload up to {maxImages} reference images
              </p>
            </div>
          )}
        </div>
      )}

      <input
        id="selective-edit-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        {selectedImages.length > 0 
          ? `${selectedImages.length}/${maxImages} references • Click + to add more`
          : 'Upload textures, patterns, or furniture photos as references'}
      </p>
    </div>
  );
}
