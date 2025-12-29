import { Package, Search, PenTool, Trash2, X, Lock, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetectedItem } from './AIDetectionOverlay';

interface DetectionActionMenuProps {
  item: DetectedItem;
  style: { left: string; top: string; width: string; height: string };
  onAction: (action: 'replace' | 'similar' | 'custom' | 'remove' | 'lock' | 'upload') => void;
  onClose: () => void;
  isLocked?: boolean;
}

export function DetectionActionMenu({
  item,
  style,
  onAction,
  onClose,
  isLocked = false,
}: DetectionActionMenuProps) {
  const actions = [
    { 
      id: 'lock' as const, 
      icon: Lock, 
      label: isLocked ? 'Unlock Item' : 'Keep (Lock)', 
      className: isLocked ? 'text-green-500 bg-green-500/10' : 'text-green-500 hover:bg-green-500/10' 
    },
    { id: 'replace' as const, icon: Package, label: 'Replace from Catalogue' },
    { id: 'similar' as const, icon: Search, label: 'Find Similar' },
    { id: 'upload' as const, icon: Upload, label: 'Upload Product' },
    { id: 'custom' as const, icon: PenTool, label: 'Create Custom' },
    { id: 'remove' as const, icon: Trash2, label: 'Remove', className: 'text-destructive hover:bg-destructive/10' },
  ];

  // Position menu to the right of the bounding box, or left if near edge
  const leftVal = parseFloat(style.left) + parseFloat(style.width);
  const menuLeft = leftVal > 70 ? `calc(${style.left} - 180px)` : `calc(${style.left} + ${style.width} + 8px)`;

  return (
    <div
      className="absolute z-40 animate-fade-in"
      style={{
        left: menuLeft,
        top: style.top,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="glass-premium rounded-lg border border-border shadow-xl overflow-hidden w-48">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
          <span className="text-xs font-medium truncate">{item.label}</span>
          <button
            onClick={onClose}
            className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-1">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors',
                'hover:bg-muted/50',
                action.className
              )}
            >
              <action.icon className="h-3.5 w-3.5" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}