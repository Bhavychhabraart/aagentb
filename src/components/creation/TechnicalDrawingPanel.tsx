import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, Download, ZoomIn, ZoomOut, FileImage, FileText,
  Ruler, Box, Layers, LayoutGrid, RefreshCw, FileCode, Type, 
  ArrowRight, Trash2, Save, X, Move
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

interface Annotation {
  id: string;
  type: 'text' | 'dimension' | 'arrow';
  x: number; // percentage
  y: number; // percentage
  text?: string;
  endX?: number; // for arrows
  endY?: number; // for arrows
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
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [selectedType, setSelectedType] = useState<DrawingType>('orthographic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrawing, setGeneratedDrawing] = useState<string | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<GeneratedDrawing[]>([]);
  const [zoom, setZoom] = useState(100);
  
  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState<'none' | 'text' | 'dimension' | 'arrow'>('none');
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [pendingAnnotation, setPendingAnnotation] = useState<Partial<Annotation> | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

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
      setAnnotations([]); // Clear annotations for new drawing
      
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
          const maxHeight = 200;
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
          
          // Add annotations as text overlays
          if (annotations.length > 0) {
            pdf.setFontSize(8);
            annotations.forEach(ann => {
              if (ann.type === 'text' && ann.text) {
                const annX = x + (drawWidth * ann.x / 100);
                const annY = y + (drawHeight * ann.y / 100);
                pdf.text(ann.text, annX, annY);
              } else if (ann.type === 'dimension' && ann.text) {
                const annX = x + (drawWidth * ann.x / 100);
                const annY = y + (drawHeight * ann.y / 100);
                pdf.text(`↔ ${ann.text}`, annX, annY);
              }
            });
          }
          
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

  const handleDownloadSVG = () => {
    if (!generatedDrawing) return;
    
    // Create an SVG with the image and annotations
    const svgWidth = 800;
    const svgHeight = 600;
    
    let annotationsSvg = '';
    annotations.forEach(ann => {
      const x = (svgWidth * ann.x / 100);
      const y = (svgHeight * ann.y / 100);
      
      if (ann.type === 'text' && ann.text) {
        annotationsSvg += `<text x="${x}" y="${y}" font-size="12" fill="#333">${ann.text}</text>\n`;
      } else if (ann.type === 'dimension' && ann.text) {
        annotationsSvg += `<text x="${x}" y="${y}" font-size="10" fill="#666">↔ ${ann.text}</text>\n`;
      } else if (ann.type === 'arrow' && ann.endX !== undefined && ann.endY !== undefined) {
        const endX = (svgWidth * ann.endX / 100);
        const endY = (svgHeight * ann.endY / 100);
        annotationsSvg += `<line x1="${x}" y1="${y}" x2="${endX}" y2="${endY}" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>\n`;
      }
    });
    
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
    </marker>
  </defs>
  <image xlink:href="${generatedDrawing}" width="${svgWidth}" height="${svgHeight}"/>
  ${annotationsSvg}
</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technical-drawing-${selectedType}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded SVG!', description: 'Can be imported into CAD software.' });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (annotationMode === 'none' || !generatedDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (annotationMode === 'arrow') {
      if (!pendingAnnotation) {
        setPendingAnnotation({ type: 'arrow', x, y });
        toast({ title: 'Click endpoint for arrow' });
      } else {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'arrow',
          x: pendingAnnotation.x!,
          y: pendingAnnotation.y!,
          endX: x,
          endY: y,
        };
        setAnnotations(prev => [...prev, newAnnotation]);
        setPendingAnnotation(null);
        setAnnotationMode('none');
      }
    } else {
      setPendingAnnotation({ type: annotationMode, x, y });
    }
  };

  const handleAddAnnotation = () => {
    if (!pendingAnnotation || !newAnnotationText.trim()) return;
    
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: pendingAnnotation.type as 'text' | 'dimension',
      x: pendingAnnotation.x!,
      y: pendingAnnotation.y!,
      text: newAnnotationText.trim(),
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    setNewAnnotationText('');
    setPendingAnnotation(null);
    setAnnotationMode('none');
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setSelectedAnnotation(null);
  };

  const selectFromHistory = (drawing: GeneratedDrawing) => {
    setGeneratedDrawing(drawing.imageUrl);
    setSelectedType(drawing.type);
    setAnnotations([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Drawing Type Selector */}
      <div className="p-3 border-b border-border">
        <Label className="text-xs font-medium mb-2 block">Drawing Type</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {DRAWING_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "flex items-center gap-1.5 p-2 rounded-lg border-2 transition-all text-left",
                  selectedType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  selectedType === type.id ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium truncate">{type.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !furnitureImage}
          className="w-full gap-2"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Ruler className="h-3.5 w-3.5" />
              Generate Drawing
            </>
          )}
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {generatedDrawing ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(prev => Math.max(50, prev - 25))}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-muted-foreground w-8 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(prev => Math.min(200, prev + 25))}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownloadPNG} title="Download PNG">
                  <FileImage className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownloadPDF} title="Download PDF">
                  <FileText className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownloadSVG} title="Export SVG (CAD)">
                  <FileCode className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className={cn("h-3 w-3", isGenerating && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Annotation Tools */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/30">
              <span className="text-[10px] text-muted-foreground mr-1">Annotate:</span>
              <Button
                variant={annotationMode === 'text' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setAnnotationMode(annotationMode === 'text' ? 'none' : 'text')}
                title="Add Text"
              >
                <Type className="h-3 w-3" />
              </Button>
              <Button
                variant={annotationMode === 'dimension' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setAnnotationMode(annotationMode === 'dimension' ? 'none' : 'dimension')}
                title="Add Dimension"
              >
                <Ruler className="h-3 w-3" />
              </Button>
              <Button
                variant={annotationMode === 'arrow' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setAnnotationMode(annotationMode === 'arrow' ? 'none' : 'arrow')}
                title="Add Arrow"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
              {annotations.length > 0 && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => setAnnotations([])}
                    title="Clear All"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <span className="text-[10px] text-muted-foreground ml-1">({annotations.length})</span>
                </>
              )}
            </div>

            {/* Pending Annotation Input */}
            {pendingAnnotation && pendingAnnotation.type !== 'arrow' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20">
                <Input
                  value={newAnnotationText}
                  onChange={(e) => setNewAnnotationText(e.target.value)}
                  placeholder={pendingAnnotation.type === 'dimension' ? "e.g., 120cm" : "Label text..."}
                  className="h-7 text-xs flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAnnotation()}
                />
                <Button size="sm" className="h-7 px-2" onClick={handleAddAnnotation}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setPendingAnnotation(null); setNewAnnotationText(''); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Drawing Preview with Annotations */}
            <div className="flex-1 overflow-auto p-3 bg-muted/30">
              <div 
                ref={canvasRef}
                className={cn(
                  "relative mx-auto bg-background border border-border rounded-lg overflow-hidden shadow-sm",
                  annotationMode !== 'none' && "cursor-crosshair"
                )}
                style={{ 
                  width: `${Math.min(260, 260 * (zoom / 100))}px`,
                }}
                onClick={handleCanvasClick}
              >
                {isGenerating ? (
                  <div className="aspect-[4/3] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <img 
                      src={generatedDrawing} 
                      alt="Technical Drawing" 
                      className="w-full"
                      draggable={false}
                    />
                    {/* Render Annotations */}
                    {annotations.map(ann => (
                      <div
                        key={ann.id}
                        className={cn(
                          "absolute group",
                          selectedAnnotation === ann.id && "ring-2 ring-primary"
                        )}
                        style={{ 
                          left: `${ann.x}%`, 
                          top: `${ann.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnnotation(ann.id);
                        }}
                      >
                        {ann.type === 'text' && (
                          <div className="px-1.5 py-0.5 bg-white/90 border border-gray-300 rounded text-[10px] font-medium shadow-sm whitespace-nowrap">
                            {ann.text}
                          </div>
                        )}
                        {ann.type === 'dimension' && (
                          <div className="px-1.5 py-0.5 bg-blue-100 border border-blue-300 rounded text-[10px] font-mono shadow-sm whitespace-nowrap">
                            ↔ {ann.text}
                          </div>
                        )}
                        {ann.type === 'arrow' && ann.endX !== undefined && ann.endY !== undefined && (
                          <svg 
                            className="absolute overflow-visible pointer-events-none"
                            style={{ left: 0, top: 0 }}
                          >
                            <defs>
                              <marker id={`arrow-${ann.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                <path d="M0,0 L0,8 L8,4 z" fill="#ef4444"/>
                              </marker>
                            </defs>
                            <line
                              x1="0"
                              y1="0"
                              x2={`${(ann.endX - ann.x) * 2.6}px`}
                              y2={`${(ann.endY - ann.y) * 2.6}px`}
                              stroke="#ef4444"
                              strokeWidth="2"
                              markerEnd={`url(#arrow-${ann.id})`}
                            />
                          </svg>
                        )}
                        {/* Delete button on hover */}
                        <button
                          className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnotation(ann.id);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
            <Ruler className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-xs font-medium">No drawing generated</p>
            <p className="text-[10px] mt-1">Select a type and generate</p>
          </div>
        )}
      </div>

      {/* History */}
      {drawingHistory.length > 0 && (
        <div className="border-t border-border">
          <div className="p-2">
            <Label className="text-[10px] text-muted-foreground">History</Label>
          </div>
          <ScrollArea className="h-20">
            <div className="px-2 pb-2 flex gap-1.5">
              {drawingHistory.map((drawing) => (
                <button
                  key={drawing.id}
                  onClick={() => selectFromHistory(drawing)}
                  className={cn(
                    "shrink-0 w-14 rounded-md overflow-hidden border-2 transition-all",
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
                  <Badge variant="secondary" className="w-full rounded-none text-[7px] justify-center py-0">
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
