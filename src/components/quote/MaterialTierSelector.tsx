import { Badge } from '@/components/ui/badge';
import { Coins, Star, Crown, Check } from 'lucide-react';
import { formatINR } from '@/utils/formatCurrency';

interface QuoteVersion {
  version_name: string;
  tier_level: number;
  items: any[];
  subtotal: number;
  commission: number;
  grand_total: number;
  is_recommended: boolean;
}

interface MaterialTierSelectorProps {
  versions: QuoteVersion[];
  selectedTier: 'budget' | 'standard' | 'premium';
  onTierChange: (tier: 'budget' | 'standard' | 'premium') => void;
}

export function MaterialTierSelector({ 
  versions, 
  selectedTier, 
  onTierChange 
}: MaterialTierSelectorProps) {
  const tiers = [
    { 
      key: 'budget' as const, 
      icon: Coins, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    { 
      key: 'standard' as const, 
      icon: Star, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    { 
      key: 'premium' as const, 
      icon: Crown, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Select Material Tier</h4>
      
      <div className="grid grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const version = versions.find(
            v => v.version_name.toLowerCase() === tier.key
          );
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.key;

          return (
            <button
              key={tier.key}
              onClick={() => onTierChange(tier.key)}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                isSelected 
                  ? `${tier.borderColor} ${tier.bgColor} ring-2 ring-offset-2 ring-primary/20` 
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              {version?.is_recommended && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs"
                >
                  Recommended
                </Badge>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${tier.color}`} />
                <span className="font-semibold capitalize">{tier.key}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>

              {version ? (
                <>
                  <p className="text-2xl font-bold">
                    {formatINR(version.grand_total)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {version.items.length} items
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No variant available
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Savings comparison */}
      {versions.length === 3 && (
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>
            Budget saves {formatINR(versions[2].grand_total - versions[0].grand_total)} vs Premium
          </span>
        </div>
      )}
    </div>
  );
}
