import { useEffect, useState } from 'react';
import { FabricObject } from 'fabric';
import { RotateCw, RotateCcw, Trash2, FlipHorizontal, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PIXELS_PER_INCH } from '@/types/layout-creator';

interface PropertiesPanelProps {
  selectedObject: FabricObject | null;
  onRotate: (degrees: number) => void;
  onDelete: () => void;
  unit: string;
}

export function PropertiesPanel({ 
  selectedObject, 
  onRotate, 
  onDelete,
  unit 
}: PropertiesPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);
  const [objectType, setObjectType] = useState<string>('');
  const [objectName, setObjectName] = useState<string>('');

  useEffect(() => {
    if (!selectedObject) {
      setPosition({ x: 0, y: 0 });
      setSize({ width: 0, height: 0 });
      setRotation(0);
      setObjectType('');
      setObjectName('');
      return;
    }

    const objData = (selectedObject as FabricObject & { data?: Record<string, unknown> }).data;
    
    setPosition({
      x: Math.round((selectedObject.left || 0) / PIXELS_PER_INCH),
      y: Math.round((selectedObject.top || 0) / PIXELS_PER_INCH),
    });
    
    setSize({
      width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1) / PIXELS_PER_INCH),
      height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1) / PIXELS_PER_INCH),
    });
    
    setRotation(Math.round(selectedObject.angle || 0));
    setObjectType(objData?.type as string || 'object');
    setObjectName(objData?.name as string || '');
  }, [selectedObject]);

  const formatValue = (inches: number): string => {
    if (unit === 'ft') {
      const feet = Math.floor(inches / 12);
      const remainingInches = inches % 12;
      return remainingInches > 0 ? `${feet}' ${remainingInches}"` : `${feet}'`;
    }
    if (unit === 'm') {
      return `${(inches * 0.0254).toFixed(2)}m`;
    }
    if (unit === 'cm') {
      return `${Math.round(inches * 2.54)}cm`;
    }
    return `${inches}"`;
  };

  if (!selectedObject) {
    return (
      <div className="w-64 border-l border-border bg-card p-4">
        <h2 className="font-semibold text-sm mb-4">Properties</h2>
        <div className="text-sm text-muted-foreground text-center py-8">
          Select an object to view properties
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Properties</h2>
      </div>

      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        {/* Object Type */}
        <div>
          <Badge variant="outline" className="capitalize">
            {objectType}
          </Badge>
          {objectName && (
            <p className="text-sm mt-1 font-medium">{objectName}</p>
          )}
        </div>

        <Separator />

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pos-x" className="text-xs">X</Label>
              <Input
                id="pos-x"
                value={formatValue(position.x)}
                readOnly
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="pos-y" className="text-xs">Y</Label>
              <Input
                id="pos-y"
                value={formatValue(position.y)}
                readOnly
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="size-w" className="text-xs">Width</Label>
              <Input
                id="size-w"
                value={formatValue(size.width)}
                readOnly
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="size-h" className="text-xs">Height</Label>
              <Input
                id="size-h"
                value={formatValue(size.height)}
                readOnly
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Rotation</Label>
          <div className="flex items-center gap-2">
            <Input
              value={`${rotation}°`}
              readOnly
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRotate(-15)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRotate(15)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Actions</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onRotate(90)}
            >
              <RotateCw className="h-3 w-3 mr-1" />
              90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled
            >
              <FlipHorizontal className="h-3 w-3 mr-1" />
              Flip
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <div className="p-3 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Object
        </Button>
      </div>
    </div>
  );
}
