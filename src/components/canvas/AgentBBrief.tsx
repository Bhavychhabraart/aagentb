import { Home, Palette, Package, Grid3X3, ImageIcon, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AgentBUnderstanding {
  roomType: string;
  detectedStyle: string;
  dimensions: string;
  colorPalette: string[];
  stagedProducts: string[];
  hasLayout: boolean;
  hasStyleRef: boolean;
  layoutAnalysis?: string;
  styleNotes?: string;
}

interface AgentBBriefProps {
  understanding: AgentBUnderstanding;
  onEdit?: (field: keyof AgentBUnderstanding) => void;
  onConfirm?: () => void;
  onCorrect?: () => void;
}

export function AgentBBrief({ understanding, onEdit, onConfirm, onCorrect }: AgentBBriefProps) {
  const briefItems = [
    {
      icon: Home,
      label: 'Room Type',
      value: understanding.roomType,
      detail: understanding.dimensions,
      field: 'roomType' as const,
    },
    {
      icon: Palette,
      label: 'Detected Style',
      value: understanding.detectedStyle,
      detail: understanding.styleNotes,
      field: 'detectedStyle' as const,
    },
    {
      icon: Package,
      label: 'Staged Products',
      value: `${understanding.stagedProducts.length} items`,
      detail: understanding.stagedProducts.slice(0, 3).join(', ') + (understanding.stagedProducts.length > 3 ? '...' : ''),
      field: 'stagedProducts' as const,
    },
    {
      icon: Grid3X3,
      label: 'Layout',
      value: understanding.hasLayout ? 'Floor plan detected' : 'No layout uploaded',
      detail: understanding.layoutAnalysis,
      field: 'hasLayout' as const,
    },
    {
      icon: ImageIcon,
      label: 'Style References',
      value: understanding.hasStyleRef ? 'References found' : 'No references',
      field: 'hasStyleRef' as const,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg">✨</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Agent B understood your brief</h3>
          <p className="text-xs text-muted-foreground">Review and correct if needed</p>
        </div>
      </div>

      {/* Brief items */}
      <div className="space-y-2 mb-4">
        {briefItems.map((item) => (
          <div
            key={item.field}
            className={cn(
              "group flex items-start gap-3 p-2.5 rounded-xl",
              "glass border border-border/20 transition-all duration-200",
              "hover:border-primary/30 hover:bg-primary/5"
            )}
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item.field)}
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
              {item.detail && (
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{item.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Color palette */}
      {understanding.colorPalette.length > 0 && (
        <div className="mb-4 p-2.5 rounded-xl glass border border-border/20">
          <span className="text-xs text-muted-foreground">Detected Palette</span>
          <div className="flex gap-1.5 mt-1.5">
            {understanding.colorPalette.map((color, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full border border-border/30"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCorrect}
          className="flex-1 glass-input"
        >
          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
          Correct Something
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className="flex-1 btn-glow"
        >
          Looks Good ✓
        </Button>
      </div>
    </div>
  );
}
