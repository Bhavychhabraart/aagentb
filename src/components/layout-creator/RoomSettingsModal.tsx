import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoomDimensions, UnitType } from '@/types/layout-creator';

interface RoomSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDimensions: RoomDimensions;
  onSave: (dimensions: RoomDimensions) => void;
  isNewLayout?: boolean;
}

export function RoomSettingsModal({
  open,
  onOpenChange,
  initialDimensions,
  onSave,
  isNewLayout = false,
}: RoomSettingsModalProps) {
  const [width, setWidth] = useState(initialDimensions.width.toString());
  const [depth, setDepth] = useState(initialDimensions.depth.toString());
  const [unit, setUnit] = useState<UnitType>(initialDimensions.unit);

  const handleSave = () => {
    const widthNum = parseFloat(width) || 20;
    const depthNum = parseFloat(depth) || 15;
    
    onSave({
      width: widthNum,
      depth: depthNum,
      unit,
    });
    onOpenChange(false);
  };

  const presets = [
    { label: 'Small Room', width: 12, depth: 10 },
    { label: 'Medium Room', width: 16, depth: 14 },
    { label: 'Large Room', width: 20, depth: 18 },
    { label: 'Living Room', width: 24, depth: 16 },
    { label: 'Master Bedroom', width: 18, depth: 16 },
    { label: 'Studio', width: 30, depth: 20 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNewLayout ? 'Create New Layout' : 'Room Settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(preset => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2"
                  onClick={() => {
                    setWidth(preset.width.toString());
                    setDepth(preset.depth.toString());
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span>{preset.label}</span>
                    <span className="text-muted-foreground">
                      {preset.width}' × {preset.depth}'
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-2">
              <Label htmlFor="room-width">Width</Label>
              <Input
                id="room-width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min={1}
                step={0.5}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="room-depth">Depth</Label>
              <Input
                id="room-depth"
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                min={1}
                step={0.5}
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="room-unit">Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as UnitType)}>
                <SelectTrigger id="room-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ft">ft</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <div 
              className="mx-auto border-2 border-primary bg-background flex items-center justify-center"
              style={{
                width: Math.min(200, parseFloat(width) * 8 || 160),
                height: Math.min(150, parseFloat(depth) * 8 || 120),
              }}
            >
              <span className="text-sm text-muted-foreground">
                {width || '0'}{unit === 'ft' ? "'" : unit} × {depth || '0'}{unit === 'ft' ? "'" : unit}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNewLayout ? 'Create Layout' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
