import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, Sparkles, FileImage, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RoomDimensions } from '@/types/wizard';
import { ROOM_TYPES } from '@/types/wizard';

interface LayoutUploadStepProps {
  layoutUrl?: string;
  roomDimensions?: RoomDimensions;
  roomType?: string;
  onLayoutUpload: (url: string, thumbnail?: string) => void;
  onDimensionsChange: (dimensions: RoomDimensions) => void;
  onRoomTypeChange: (type: string) => void;
  onNext: () => void;
}

export function LayoutUploadStep({
  layoutUrl,
  roomDimensions,
  roomType,
  onLayoutUpload,
  onDimensionsChange,
  onRoomTypeChange,
  onNext,
}: LayoutUploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dimensions, setDimensions] = useState<RoomDimensions>(
    roomDimensions || { width: 20, depth: 15, unit: 'ft' }
  );

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('layouts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('layouts')
        .getPublicUrl(data.path);

      onLayoutUpload(urlData.publicUrl);
      toast.success('Layout uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload layout');
    } finally {
      setIsUploading(false);
    }
  }, [onLayoutUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDimensionChange = (key: keyof RoomDimensions, value: number | string) => {
    const newDimensions = { ...dimensions, [key]: value };
    setDimensions(newDimensions);
    onDimensionsChange(newDimensions);
  };

  const canProceed = layoutUrl && roomType && dimensions.width > 0 && dimensions.depth > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-6 space-y-8"
    >
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5 overflow-hidden">
        <CardContent className="p-0">
          {layoutUrl ? (
            <div className="relative aspect-video">
              <img
                src={layoutUrl}
                alt="Uploaded layout"
                className="w-full h-full object-contain bg-black/5"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => onLayoutUpload('')}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm">
                <FileImage className="w-4 h-4 inline-block mr-2" />
                Layout uploaded
              </div>
            </div>
          ) : (
            <div
              className={`
                relative aspect-video flex flex-col items-center justify-center p-12 cursor-pointer
                transition-all duration-300
                ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/10'}
              `}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => document.getElementById('layout-input')?.click()}
            >
              <input
                id="layout-input"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <motion.div
                animate={{ scale: dragActive ? 1.1 : 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  {isUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Upload className="w-8 h-8 text-primary" />
                    </motion.div>
                  ) : (
                    <Upload className="w-8 h-8 text-primary" />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-lg font-medium">
                    {isUploading ? 'Uploading...' : 'Drop your floor plan here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • Supports PNG, JPG, PDF
                  </p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Detect Walls
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Type */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-sm font-medium">Room Type</Label>
            <Select value={roomType} onValueChange={onRoomTypeChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-sm font-medium">Room Dimensions</Label>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <span className="text-muted-foreground mt-5">×</span>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Depth</Label>
                <Input
                  type="number"
                  value={dimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', parseFloat(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <div className="w-20">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Select
                  value={dimensions.unit}
                  onValueChange={(val) => handleDimensionChange('unit', val as 'ft' | 'm')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          className="gap-2 px-8"
          onClick={onNext}
          disabled={!canProceed}
        >
          Continue to Mood Board
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </Button>
      </div>
    </motion.div>
  );
}
