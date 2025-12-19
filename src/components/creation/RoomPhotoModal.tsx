import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Image, X } from "lucide-react";

interface UploadedItem {
  file?: File;
  preview: string;
  name: string;
}

interface RoomPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (item: UploadedItem) => void;
  currentUpload?: UploadedItem;
}

export function RoomPhotoModal({
  open,
  onOpenChange,
  onUpload,
  currentUpload,
}: RoomPhotoModalProps) {
  const [preview, setPreview] = useState<UploadedItem | undefined>(currentUpload);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({
        file,
        preview: e.target?.result as string,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleConfirm = () => {
    if (preview) {
      onUpload(preview);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Upload Room Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <img
                src={preview.preview}
                alt="Room preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                onClick={() => setPreview(undefined)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-sm text-muted-foreground mt-2 truncate">
                {preview.name}
              </p>
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
                Drag and drop your room photo here
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                This will be used as a reference for virtual staging
              </p>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
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
            <Button onClick={handleConfirm} disabled={!preview}>
              Add Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
