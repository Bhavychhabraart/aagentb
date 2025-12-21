import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SelectiveEditUploaderProps {
  selectedImage: string | null;
  onImageSelect: (imageUrl: string | null) => void;
}

export function SelectiveEditUploader({ 
  selectedImage, 
  onImageSelect 
}: SelectiveEditUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const fileName = `${user.id}/selective-edit/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);

      onImageSelect(publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [user, onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  if (selectedImage) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={selectedImage}
            alt="Reference upload"
            className="w-full h-32 object-contain bg-muted"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => onImageSelect(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          This image will be used as reference for the edit
        </p>
      </div>
    );
  }

  return (
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
      <input
        id="selective-edit-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
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
            Upload a texture, pattern, or furniture photo
          </p>
        </div>
      )}
    </div>
  );
}
