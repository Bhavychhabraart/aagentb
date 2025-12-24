import { useState } from 'react';
import { Camera, X, Wand2, RotateCw, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { CameraData } from './CameraPlacement';
import { cn } from '@/lib/utils';

interface CameraPropertiesPanelProps {
  camera: CameraData;
  onUpdate: (camera: CameraData) => void;
  onDelete: () => void;
  onGenerate: (prompt: string) => void;
  onClose: () => void;
  isGenerating: boolean;
}

export function CameraPropertiesPanel({
  camera,
  onUpdate,
  onDelete,
  onGenerate,
  onClose,
  isGenerating,
}: CameraPropertiesPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  const handleGenerateClick = () => {
    if (showPromptInput && prompt.trim()) {
      onGenerate(prompt);
      setPrompt('');
      setShowPromptInput(false);
    } else {
      setShowPromptInput(true);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border shadow-lg animate-in slide-in-from-bottom-5 duration-200">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Camera className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Camera Settings</h3>
              <p className="text-xs text-muted-foreground">Adjust camera position and FOV</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Camera Properties */}
        <div className="grid grid-cols-2 gap-4">
          {/* Camera Name */}
          <div className="col-span-2">
            <Label htmlFor="camera-name" className="text-xs text-muted-foreground">Camera Name</Label>
            <Input
              id="camera-name"
              value={camera.name}
              onChange={(e) => onUpdate({ ...camera, name: e.target.value })}
              className="h-8 text-sm mt-1"
              placeholder="e.g. Living Room Corner"
            />
          </div>

          {/* Position */}
          <div>
            <Label className="text-xs text-muted-foreground">Position X</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[camera.x]}
                onValueChange={([x]) => onUpdate({ ...camera, x })}
                min={5}
                max={95}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-mono w-10 text-right text-muted-foreground">{Math.round(camera.x)}%</span>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Position Y</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[camera.y]}
                onValueChange={([y]) => onUpdate({ ...camera, y })}
                min={5}
                max={95}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-mono w-10 text-right text-muted-foreground">{Math.round(camera.y)}%</span>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <RotateCw className="h-3 w-3" />
              Rotation
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[camera.rotation]}
                onValueChange={([rotation]) => onUpdate({ ...camera, rotation })}
                min={0}
                max={360}
                step={5}
                className="flex-1"
              />
              <span className="text-xs font-mono w-10 text-right text-muted-foreground">{camera.rotation}°</span>
            </div>
          </div>

          {/* FOV Angle */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Field of View
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[camera.fovAngle]}
                onValueChange={([fovAngle]) => onUpdate({ ...camera, fovAngle })}
                min={30}
                max={120}
                step={5}
                className="flex-1"
              />
              <span className="text-xs font-mono w-10 text-right text-muted-foreground">{camera.fovAngle}°</span>
            </div>
          </div>
        </div>

        {/* Prompt Input (shown when Generate is clicked) */}
        {showPromptInput && (
          <div className="space-y-2 pt-2 border-t border-border">
            <Label htmlFor="camera-prompt" className="text-xs text-muted-foreground">
              Scene Description
            </Label>
            <Textarea
              id="camera-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene style... e.g. 'Modern minimalist with warm evening lighting'"
              className="min-h-[60px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                  e.preventDefault();
                  onGenerate(prompt);
                  setPrompt('');
                  setShowPromptInput(false);
                }
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
          >
            Delete Camera
          </Button>

          <div className="flex gap-2">
            {showPromptInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPromptInput(false)}
                className="h-8"
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleGenerateClick}
              disabled={isGenerating || (showPromptInput && !prompt.trim())}
              className={cn(
                "h-8 gap-1.5",
                "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  {showPromptInput ? 'Generate View' : 'Generate from Camera'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
