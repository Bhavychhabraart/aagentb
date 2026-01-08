import { CatalogFurnitureItem } from '@/services/catalogService';
import { CatalogViewMode } from './CatalogViewSwitcher';
import { GridView } from './views/GridView';
import { MagazineView } from './views/MagazineView';
import { ListView } from './views/ListView';
import { MasonryView } from './views/MasonryView';
import { RealspaceView } from './views/RealspaceView';

interface CatalogProductViewProps {
  items: CatalogFurnitureItem[];
  view: CatalogViewMode;
  selectedItems: string[];
  onToggleItem: (item: CatalogFurnitureItem) => void;
  onPreviewItem?: (item: CatalogFurnitureItem) => void;
}

export function CatalogProductView({
  items,
  view,
  selectedItems,
  onToggleItem,
  onPreviewItem,
}: CatalogProductViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No products found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  const viewProps = {
    items,
    selectedItems,
    onToggleItem,
    onPreviewItem,
  };

  switch (view) {
    case 'magazine':
      return <MagazineView {...viewProps} />;
    case 'list':
      return <ListView {...viewProps} />;
    case 'masonry':
      return <MasonryView {...viewProps} />;
    case 'realspace':
      return <RealspaceView {...viewProps} />;
    case 'grid':
    default:
      return <GridView {...viewProps} />;
  }
}
