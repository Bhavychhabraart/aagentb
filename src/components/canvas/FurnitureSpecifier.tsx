import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface FurnitureSpec {
  id: string;
  type: string;
  material: string;
  color: string;
  position: string;
  isCustom: boolean;
  enabled: boolean;
}

interface FurnitureSpecifierProps {
  detectedFurniture: Array<{ type: string; position?: string }>;
  onSpecsChange: (specs: FurnitureSpec[]) => void;
}

const FURNITURE_TYPES = [
  'Sofa', 'Armchair', 'Coffee Table', 'Dining Table', 'Dining Chair',
  'Bed', 'Nightstand', 'Dresser', 'Desk', 'Office Chair',
  'Bookshelf', 'TV Unit', 'Console Table', 'Side Table', 'Ottoman',
  'Floor Lamp', 'Pendant Light', 'Chandelier', 'Rug', 'Plant',
  'Cabinet', 'Wardrobe', 'Bench', 'Bar Stool', 'Custom'
];

const MATERIALS = [
  'Fabric', 'Leather', 'Wood', 'Metal', 'Glass', 'Marble',
  'Velvet', 'Linen', 'Rattan', 'Concrete', 'Ceramic', 'Other'
];

const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Beige', hex: '#d4c5a9' },
  { name: 'Brown', hex: '#8b4513' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Green', hex: '#2d5a27' },
  { name: 'Terracotta', hex: '#c75b39' },
  { name: 'Walnut', hex: '#5c4033' },
  { name: 'Oak', hex: '#c8a45c' },
  { name: 'Natural', hex: '#deb887' },
  { name: 'Custom', hex: '#9ca3af' },
];

const POSITIONS = [
  'Center', 'Left wall', 'Right wall', 'Back wall', 'Front',
  'Corner (left)', 'Corner (right)', 'Near window', 'Near door',
  'By fireplace', 'Floating', 'Custom'
];

export function FurnitureSpecifier({ detectedFurniture, onSpecsChange }: FurnitureSpecifierProps) {
  const [specs, setSpecs] = useState<FurnitureSpec[]>(() => 
    detectedFurniture.map((f, i) => ({
      id: `detected-${i}`,
      type: f.type,
      material: 'Fabric',
      color: 'Gray',
      position: f.position || 'Center',
      isCustom: false,
      enabled: true,
    }))
  );
  
  const [expandedId, setExpandedId] = useState<string | null>(specs[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customType, setCustomType] = useState('');

  const updateSpec = (id: string, updates: Partial<FurnitureSpec>) => {
    const newSpecs = specs.map(s => s.id === id ? { ...s, ...updates } : s);
    setSpecs(newSpecs);
    onSpecsChange(newSpecs.filter(s => s.enabled));
  };

  const removeSpec = (id: string) => {
    const newSpecs = specs.filter(s => s.id !== id);
    setSpecs(newSpecs);
    onSpecsChange(newSpecs.filter(s => s.enabled));
  };

  const addCustomFurniture = (type: string) => {
    const newSpec: FurnitureSpec = {
      id: `custom-${Date.now()}`,
      type: type === 'Custom' ? customType || 'Custom Item' : type,
      material: 'Fabric',
      color: 'Gray',
      position: 'Center',
      isCustom: true,
      enabled: true,
    };
    const newSpecs = [...specs, newSpec];
    setSpecs(newSpecs);
    setExpandedId(newSpec.id);
    setShowAddForm(false);
    setCustomType('');
    onSpecsChange(newSpecs.filter(s => s.enabled));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Furniture Specification
          <span className="text-xs text-muted-foreground">({specs.filter(s => s.enabled).length} items)</span>
        </h4>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {specs.map((spec) => (
          <div
            key={spec.id}
            className={cn(
              "border rounded-lg transition-all",
              spec.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
            )}
          >
            {/* Header row */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === spec.id ? null : spec.id)}
            >
              <Checkbox
                checked={spec.enabled}
                onCheckedChange={(checked) => updateSpec(spec.id, { enabled: !!checked })}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={cn(
                "flex-1 text-sm font-medium",
                !spec.enabled && "text-muted-foreground"
              )}>
                {spec.type}
              </span>
              {spec.isCustom && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Custom</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); removeSpec(spec.id); }}
              >
                <X className="h-3 w-3" />
              </Button>
              {expandedId === spec.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            {/* Expanded details */}
            {expandedId === spec.id && (
              <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Material</label>
                    <Select
                      value={spec.material}
                      onValueChange={(value) => updateSpec(spec.id, { material: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIALS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                    <Select
                      value={spec.color}
                      onValueChange={(value) => updateSpec(spec.id, { color: value })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map(c => (
                          <SelectItem key={c.name} value={c.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full border border-border" 
                                style={{ backgroundColor: c.hex }}
                              />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Position</label>
                  <Select
                    value={spec.position}
                    onValueChange={(value) => updateSpec(spec.id, { position: value })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add furniture button */}
      {!showAddForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add Furniture
        </Button>
      ) : (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Add Furniture</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddForm(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {FURNITURE_TYPES.slice(0, 12).map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => type === 'Custom' ? null : addCustomFurniture(type)}
              >
                {type}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Custom furniture type..."
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8"
              disabled={!customType.trim()}
              onClick={() => addCustomFurniture('Custom')}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
