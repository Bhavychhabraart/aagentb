import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Download, ZoomIn, ZoomOut, FileImage, FileText,
  Ruler, Box, Layers, LayoutGrid, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

export type DrawingType = 'orthographic' | 'assembly' | 'joinery' | 'full';

interface TechnicalDrawingPanelProps {
  furnitureImage: string | null;
  furnitureName: string;
  dimensions?: {
    width?: string;
    depth?: string;
    height?: string;
  };
  materials?: string[];
}

interface GeneratedDrawing {
  id: string;
  type: DrawingType;
  imageUrl: string;
  timestamp: Date;
}

const DRAWING_TYPES: { id: DrawingType; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'orthographic', label: 'Orthographic', description: 'Front, Side, Top views', icon: LayoutGrid },
  { id: 'assembly', label: 'Assembly', description: 'Exploded parts view', icon: Layers },
  { id: 'joinery', label: 'Joinery', description: 'Joint details', icon: Box },
  { id: 'full', label: 'Full Sheet', description: 'Complete technical sheet', icon: Ruler },
];

export function TechnicalDrawingPanel({
  furnitureImage,
  furnitureName,
  dimensions,
  materials,
}: TechnicalDrawingPanelProps) {
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState<DrawingType>('orthographic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrawing, setGeneratedDrawing] = useState<string | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<GeneratedDrawing[]>([]);
  const [zoom, setZoom] = useState(100);

  const handleGenerate = async () => {
    if (!furnitureImage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please generate furniture first.' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-technical-drawing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          imageUrl: furnitureImage,
          furnitureName: furnitureName || 'Custom Furniture',
          dimensions,
          materials,
          drawingType: selectedType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const { imageUrl } = await response.json();
      setGeneratedDrawing(imageUrl);
      
      // Add to history
      const newDrawing: GeneratedDrawing = {
        id: Date.now().toString(),
        type: selectedType,
        imageUrl,
        timestamp: new Date(),
      };
      setDrawingHistory(prev => [newDrawing, ...prev].slice(0, 10));
      
      toast({ title: 'Technical drawing generated!' });
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

  const handleDownloadPNG = async () => {
    if (!generatedDrawing) return;
    
    try {
      const response = await fetch(generatedDrawing);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `technical-drawing-${selectedType}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded PNG!' });
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedDrawing) return;
    
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });

      // Add title block
      pdf.setFontSize(16);
      pdf.text(furnitureName || 'Custom Furniture', 20, 20);
      
      pdf.setFontSize(10);
      pdf.text(`Drawing Type: ${DRAWING_TYPES.find(t => t.id === selectedType)?.label}`, 20, 28);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 34);
      
      if (dimensions) {
        const dimStr = [
          dimensions.width ? `W: ${dimensions.width}cm` : '',
          dimensions.depth ? `D: ${dimensions.depth}cm` : '',
          dimensions.height ? `H: ${dimensions.height}cm` : '',
        ].filter(Boolean).join(' × ');
        if (dimStr) pdf.text(`Dimensions: ${dimStr}`, 20, 40);
      }
      
      if (materials && materials.length > 0) {
        pdf.text(`Materials: ${materials.join(', ')}`, 20, 46);
      }

      // Add the drawing image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const maxWidth = 380;
          const maxHeight = 230;
          const imgRatio = img.width / img.height;
          
          let drawWidth = maxWidth;
          let drawHeight = maxWidth / imgRatio;
          
          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = maxHeight * imgRatio;
          }
          
          const x = (420 - drawWidth) / 2;
          const y = 55;
          
          pdf.addImage(img, 'PNG', x, y, drawWidth, drawHeight);
          resolve();
        };
        img.onerror = reject;
        img.src = generatedDrawing;
      });

      pdf.save(`technical-drawing-${selectedType}-${Date.now()}.pdf`);
      toast({ title: 'Downloaded PDF!' });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({ variant: 'destructive', title: 'PDF generation failed' });
    }
  };

  const selectFromHistory = (drawing: GeneratedDrawing) => {
    setGeneratedDrawing(drawing.imageUrl);
    setSelectedType(drawing.type);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Drawing Type Selector */}
      <div className="p-4 border-b border-border">
        <Label className="text-sm font-medium mb-3 block">Drawing Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {DRAWING_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                  selectedType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  selectedType === type.id ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{type.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !furnitureImage}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Drawing...
            </>
          ) : (
            <>
              <Ruler className="h-4 w-4" />
              Generate Technical Drawing
            </>
          )}
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {generatedDrawing ? (
          <>
            {/* Zoom & Download Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom(prev => Math.max(50, prev - 25))}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom(prev => Math.min(200, prev + 25))}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadPNG}>
                  <FileImage className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadPDF}>
                  <FileText className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("h-3 w-3", isGenerating && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Drawing Preview */}
            <div className="flex-1 overflow-auto p-4 bg-muted/30">
              <div 
                className="mx-auto bg-background border border-border rounded-lg overflow-hidden shadow-sm"
                style={{ 
                  width: `${Math.min(280, 280 * (zoom / 100))}px`,
                }}
              >
                {isGenerating ? (
                  <div className="aspect-[4/3] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <img 
                    src={generatedDrawing} 
                    alt="Technical Drawing" 
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Ruler className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">No drawing generated</p>
            <p className="text-xs mt-1">Select a type and generate</p>
          </div>
        )}
      </div>

      {/* History */}
      {drawingHistory.length > 0 && (
        <div className="border-t border-border">
          <div className="p-3">
            <Label className="text-xs text-muted-foreground">History</Label>
          </div>
          <ScrollArea className="h-24">
            <div className="px-3 pb-3 flex gap-2">
              {drawingHistory.map((drawing) => (
                <button
                  key={drawing.id}
                  onClick={() => selectFromHistory(drawing)}
                  className={cn(
                    "shrink-0 w-16 rounded-md overflow-hidden border-2 transition-all",
                    generatedDrawing === drawing.imageUrl
                      ? "border-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img 
                    src={drawing.imageUrl} 
                    alt={drawing.type} 
                    className="w-full aspect-square object-cover"
                  />
                  <Badge variant="secondary" className="w-full rounded-none text-[8px] justify-center">
                    {drawing.type.slice(0, 4)}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
