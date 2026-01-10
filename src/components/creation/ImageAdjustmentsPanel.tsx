import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Sun, Contrast, Droplets, CloudSun, Sparkles, 
  RotateCcw, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  shadowIntensity: 'soft' | 'medium' | 'dramatic';
  lightingStyle: 'studio' | 'natural' | 'dramatic' | 'moody' | 'backlit';
}

interface ImageAdjustmentsPanelProps {
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (adjustments: ImageAdjustments) => void;
  onApply: () => void;
  onReset: () => void;
  isApplying: boolean;
  disabled?: boolean;
}

const SHADOW_OPTIONS: { value: ImageAdjustments['shadowIntensity']; label: string }[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'dramatic', label: 'Dramatic' },
];

const LIGHTING_OPTIONS: { value: ImageAdjustments['lightingStyle']; label: string; icon?: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'natural', label: 'Natural' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'moody', label: 'Moody' },
  { value: 'backlit', label: 'Backlit' },
];

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  shadowIntensity: 'medium',
  lightingStyle: 'studio',
};

export function ImageAdjustmentsPanel({
  adjustments,
  onAdjustmentsChange,
  onApply,
  onReset,
  isApplying,
  disabled = false,
}: ImageAdjustmentsPanelProps) {
  const updateAdjustment = <K extends keyof ImageAdjustments>(
    key: K,
    value: ImageAdjustments[K]
  ) => {
    onAdjustmentsChange({ ...adjustments, [key]: value });
  };

  const hasChanges = 
    adjustments.brightness !== 100 ||
    adjustments.contrast !== 100 ||
    adjustments.saturation !== 100 ||
    adjustments.shadowIntensity !== 'medium' ||
    adjustments.lightingStyle !== 'studio';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border-t border-border/50 bg-card/50 backdrop-blur-sm"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Image Adjustments</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!hasChanges || isApplying || disabled}
            className="h-7 px-2 text-xs gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        {/* Sliders Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sun className="h-3 w-3" />
                Brightness
              </Label>
              <span className="text-xs text-muted-foreground">{adjustments.brightness}%</span>
            </div>
            <Slider
              value={[adjustments.brightness]}
              onValueChange={([v]) => updateAdjustment('brightness', v)}
              min={0}
              max={200}
              step={5}
              disabled={disabled || isApplying}
              className="cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Contrast className="h-3 w-3" />
                Contrast
              </Label>
              <span className="text-xs text-muted-foreground">{adjustments.contrast}%</span>
            </div>
            <Slider
              value={[adjustments.contrast]}
              onValueChange={([v]) => updateAdjustment('contrast', v)}
              min={0}
              max={200}
              step={5}
              disabled={disabled || isApplying}
              className="cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Droplets className="h-3 w-3" />
                Saturation
              </Label>
              <span className="text-xs text-muted-foreground">{adjustments.saturation}%</span>
            </div>
            <Slider
              value={[adjustments.saturation]}
              onValueChange={([v]) => updateAdjustment('saturation', v)}
              min={0}
              max={200}
              step={5}
              disabled={disabled || isApplying}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Shadow Intensity */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Shadow Intensity</Label>
          <div className="flex gap-2">
            {SHADOW_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={adjustments.shadowIntensity === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateAdjustment('shadowIntensity', option.value)}
                disabled={disabled || isApplying}
                className={cn(
                  "flex-1 h-8 text-xs",
                  adjustments.shadowIntensity === option.value && "bg-primary text-primary-foreground"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Lighting Style */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CloudSun className="h-3 w-3" />
            Lighting Style
          </Label>
          <div className="flex gap-2 flex-wrap">
            {LIGHTING_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={adjustments.lightingStyle === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateAdjustment('lightingStyle', option.value)}
                disabled={disabled || isApplying}
                className={cn(
                  "h-8 text-xs px-3",
                  adjustments.lightingStyle === option.value && "bg-primary text-primary-foreground"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <Button
          onClick={onApply}
          disabled={!hasChanges || isApplying || disabled}
          className="w-full gap-2"
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying Adjustments...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Apply Adjustments
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
