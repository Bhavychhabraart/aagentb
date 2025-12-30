import { Badge } from '@/components/ui/badge';
import { Package, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface QuoteItemRowProps {
  item: any;
  tier: 'budget' | 'standard' | 'premium';
}

export function QuoteItemRow({ item, tier }: QuoteItemRowProps) {
  const isCustom = !item.catalog_match_id;
  
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
      {/* Image */}
      <div className="flex-shrink-0">
        {item.item_image_url ? (
          <img 
            src={item.item_image_url} 
            alt={item.name || item.label}
            className="w-16 h-16 object-cover rounded-lg"
          />
        ) : (
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">
            {item.name || item.label}
          </h4>
          {isCustom && (
            <Badge variant="secondary" className="flex-shrink-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Custom
            </Badge>
          )}
          {item.match_confidence > 0 && (
            <Badge variant="outline" className="flex-shrink-0">
              {item.match_confidence}% match
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {item.category}
          {item.material_name && ` • ${item.material_name}`}
        </p>
        {item.dimensions && (
          <p className="text-xs text-muted-foreground">
            {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height} {item.dimensions.unit || 'cm'}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        {item.material_upcharge > 0 && (
          <p className="text-xs text-muted-foreground line-through">
            {formatCurrency(item.base_price)}
          </p>
        )}
        <p className="font-semibold text-primary">
          {formatCurrency(item.final_price || item.base_price)}
        </p>
        {item.material_upcharge > 0 && (
          <p className="text-xs text-green-600">
            +{formatCurrency(item.material_upcharge)} material
          </p>
        )}
      </div>
    </div>
  );
}
