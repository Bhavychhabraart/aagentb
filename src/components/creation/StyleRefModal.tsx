import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Palette, X, Plus, Paintbrush, Loader2 } from "lucide-react";

interface UploadedItem {
  file?: File;
  preview: string;
  name: string;
}

interface StyleRefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (items: UploadedItem[]) => Promise<string[]> | void;
  currentUploads: UploadedItem[];
  onApplyStyleWithUpload?: (items: UploadedItem[]) => Promise<void>;
  onApplyStyle?: () => void;
  isApplyingStyle?: boolean;
  hasRender?: boolean;
}

export function StyleRefModal({
  open,
  onOpenChange,
  onUpload,
  currentUploads,
  onApplyStyleWithUpload,
  onApplyStyle,
  isApplyingStyle,
  hasRender,
}: StyleRefModalProps) {
  const [previews, setPreviews] = useState<UploadedItem[]>(currentUploads);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback((files: FileList) => {
    const newPreviews: UploadedItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          file,
          preview: e.target?.result as string,
          name: file.name,
        });

        if (newPreviews.length === files.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onUpload(previews);
  };

  // Handle Apply Style - waits for upload then applies
  const handleApplyStyleClick = async () => {
    if (previews.length === 0) return;
    
    setIsUploading(true);
    try {
      if (onApplyStyleWithUpload) {
        // Use the combined function that uploads and applies atomically
        await onApplyStyleWithUpload(previews);
      } else {
        // Fallback: upload first, then apply
        await onUpload(previews);
        onApplyStyle?.();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isProcessing = isApplyingStyle || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Add Style References
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upload mood board images to define your style direction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {previews.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview.preview}
                    alt={preview.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePreview(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFileSelect(e.target.files);
                  }}
                />
                <Plus className="w-6 h-6 text-muted-foreground" />
              </label>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop mood board images here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Add multiple images to define your style direction
              </p>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFileSelect(e.target.files);
                  }}
                />
                <Button variant="secondary" size="sm" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} variant="secondary" disabled={isProcessing}>
              {previews.length > 0 ? `Add ${previews.length} Reference${previews.length > 1 ? "s" : ""}` : "Add References"}
            </Button>
            {previews.length > 0 && hasRender && (
              <Button 
                onClick={handleApplyStyleClick}
                disabled={isProcessing}
                className={isProcessing ? "animate-glow-pulse" : ""}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                    <span>{isUploading ? 'Uploading...' : 'Applying...'}</span>
                  </div>
                ) : (
                  <>
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Apply Style
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
