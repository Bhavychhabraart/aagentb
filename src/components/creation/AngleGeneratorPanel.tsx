import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowUp, ArrowRight, ArrowLeft, Search, 
  Sparkles, Loader2, Check, X, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AngleGeneratorPanelProps {
  sourceImage: string;
  angleImages: Map<string, string>;
  generatingAngle: string | null;
  onGenerateAngle: (angle: string, customPrompt?: string) => Promise<void>;
  productName?: string;
}

const ANGLE_OPTIONS = [
  { id: 'top', label: 'Top View', icon: ArrowUp, description: 'Bird\'s eye view from above' },
  { id: 'side', label: 'Side View', icon: ArrowRight, description: 'Profile view from the side' },
  { id: 'back', label: 'Back View', icon: ArrowLeft, description: 'Rear view from behind' },
  { id: 'detailed', label: 'Detail Shot', icon: Search, description: 'Close-up of materials & craftsmanship' },
];

export function AngleGeneratorPanel({
  sourceImage,
  angleImages,
  generatingAngle,
  onGenerateAngle,
  productName,
}: AngleGeneratorPanelProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomGenerating, setIsCustomGenerating] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const handleGenerateAngle = async (angle: string) => {
    await onGenerateAngle(angle);
  };

  const handleCustomGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsCustomGenerating(true);
    try {
      await onGenerateAngle('custom', customPrompt);
      setCustomPrompt('');
    } finally {
      setIsCustomGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, angleName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${productName || 'furniture'}-${angleName}.png`;
    link.click();
  };

  const generatedAngles = Array.from(angleImages.entries());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-border/50 bg-card/50 backdrop-blur-sm"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Additional Angles
          </h3>
          {generatedAngles.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {generatedAngles.length} generated
            </span>
          )}
        </div>

        {/* Quick Angle Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {ANGLE_OPTIONS.map((angle) => {
            const Icon = angle.icon;
            const isGenerated = angleImages.has(angle.id);
            const isLoading = generatingAngle === angle.id;

            return (
              <TooltipProvider key={angle.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isGenerated ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-auto py-3 flex flex-col gap-1.5 relative",
                        isGenerated && "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                      )}
                      onClick={() => handleGenerateAngle(angle.id)}
                      disabled={!!generatingAngle}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isGenerated ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="text-[10px] font-normal">{angle.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{angle.description}</p>
                    {isGenerated && <p className="text-xs text-muted-foreground mt-1">Click to regenerate</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Custom Prompt Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Custom angle: e.g., 45° view focusing on legs..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="flex-1 h-9 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomGenerate()}
            disabled={!!generatingAngle}
          />
          <Button
            size="sm"
            onClick={handleCustomGenerate}
            disabled={!customPrompt.trim() || !!generatingAngle}
            className="gap-1.5 h-9"
          >
            {isCustomGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate
          </Button>
        </div>

        {/* Generated Angles Gallery */}
        <AnimatePresence>
          {generatedAngles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="text-xs text-muted-foreground font-medium">Generated Angles</div>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {generatedAngles.map(([angleId, imageUrl]) => {
                    const angleOption = ANGLE_OPTIONS.find(a => a.id === angleId);
                    const label = angleOption?.label || (angleId === 'custom' ? 'Custom' : angleId);
                    
                    return (
                      <motion.div
                        key={angleId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group shrink-0"
                      >
                        <button
                          onClick={() => setSelectedPreview(selectedPreview === angleId ? null : angleId)}
                          className={cn(
                            "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                            selectedPreview === angleId
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border/50 hover:border-primary/50"
                          )}
                        >
                          <img
                            src={imageUrl}
                            alt={label}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                          <span className="text-[9px] text-white font-medium">{label}</span>
                        </div>
                        
                        {/* Download button on hover */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(imageUrl, angleId);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Selected Preview */}
              <AnimatePresence>
                {selectedPreview && angleImages.has(selectedPreview) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <div className="relative rounded-xl overflow-hidden border border-border/30 bg-white">
                      <img
                        src={angleImages.get(selectedPreview)!}
                        alt="Preview"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm"
                        onClick={() => setSelectedPreview(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
