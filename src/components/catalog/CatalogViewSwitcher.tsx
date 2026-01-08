import { LayoutGrid, LayoutTemplate, List, Columns3, Home } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type CatalogViewMode = 'grid' | 'magazine' | 'list' | 'masonry' | 'realspace';

interface CatalogViewSwitcherProps {
  view: CatalogViewMode;
  onViewChange: (view: CatalogViewMode) => void;
  compact?: boolean;
}

const viewOptions = [
  { value: 'grid' as const, icon: LayoutGrid, label: 'Grid View' },
  { value: 'magazine' as const, icon: LayoutTemplate, label: 'Magazine View' },
  { value: 'list' as const, icon: List, label: 'List View' },
  { value: 'masonry' as const, icon: Columns3, label: 'Masonry View' },
  { value: 'realspace' as const, icon: Home, label: 'Realspace View' },
];

export function CatalogViewSwitcher({ view, onViewChange, compact }: CatalogViewSwitcherProps) {
  const options = compact 
    ? viewOptions.filter(o => ['grid', 'list', 'masonry'].includes(o.value))
    : viewOptions;

  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(v) => v && onViewChange(v as CatalogViewMode)}
      className="bg-muted/50 p-1 rounded-lg"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value={value} 
              aria-label={label}
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-2.5 py-1.5"
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
