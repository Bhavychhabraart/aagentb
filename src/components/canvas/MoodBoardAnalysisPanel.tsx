import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileImage, 
  Palette, 
  MapPin, 
  MessageSquare,
  Layers,
  ChevronDown,
  ChevronRight,
  Check,
  Plus
} from 'lucide-react';
import { MoodBoardAnalysis, ProductExtraction } from '@/services/moodBoardService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MoodBoardAnalysisPanelProps {
  analysis: MoodBoardAnalysis;
  onProductSelect?: (product: ProductExtraction) => void;
  onApplyProducts?: (products: ProductExtraction[]) => void;
  selectedProducts?: Set<string>;
}

export function MoodBoardAnalysisPanel({
  analysis,
  onProductSelect,
  onApplyProducts,
  selectedProducts = new Set()
}: MoodBoardAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    products: true,
    placements: true,
    colors: false,
    styles: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const placementInstructions = analysis.textAnnotations?.filter(t => t.isPlacementInstruction) || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      seating: 'bg-blue-500/20 text-blue-400',
      table: 'bg-amber-500/20 text-amber-400',
      lighting: 'bg-yellow-500/20 text-yellow-400',
      rug: 'bg-purple-500/20 text-purple-400',
      art: 'bg-pink-500/20 text-pink-400',
      accessory: 'bg-green-500/20 text-green-400',
      storage: 'bg-orange-500/20 text-orange-400',
      other: 'bg-gray-500/20 text-gray-400'
    };
    return colors[category.toLowerCase()] || colors.other;
  };

  return (
    <div className="space-y-3">
      {/* Overall Style Banner */}
      {analysis.overallStyle && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">Design Direction</p>
          <p className="text-sm text-muted-foreground mt-1">{analysis.overallStyle}</p>
        </div>
      )}

      <ScrollArea className="h-[400px] pr-2">
        <div className="space-y-2">
          {/* Products Section */}
          <Collapsible open={expandedSections.products}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('products')}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Products</span>
                <Badge variant="secondary" className="text-xs">
                  {analysis.products?.length || 0}
                </Badge>
              </div>
              {expandedSections.products ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {analysis.products?.map((product, index) => (
                <div
                  key={index}
                  onClick={() => onProductSelect?.(product)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedProducts.has(product.name) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        {selectedProducts.has(product.name) && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <Badge className={`${getCategoryColor(product.category)} mt-1 text-xs`}>
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  {product.placementInstruction && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
                      <MapPin className="w-3 h-3" />
                      <span>{product.placementInstruction}</span>
                    </div>
                  )}
                  {product.zone && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Zone: {product.zone}
                    </Badge>
                  )}
                </div>
              ))}
              
              {onApplyProducts && analysis.products?.length > 0 && (
                <Button 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => onApplyProducts(analysis.products)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Apply All Products to Zone
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Placement Instructions */}
          {placementInstructions.length > 0 && (
            <Collapsible open={expandedSections.placements}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('placements')}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm">Placement Instructions</span>
                  <Badge variant="secondary" className="text-xs">
                    {placementInstructions.length}
                  </Badge>
                </div>
                {expandedSections.placements ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {placementInstructions.map((instruction, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                  >
                    <p className="text-sm font-medium text-amber-500">"{instruction.text}"</p>
                    {instruction.context && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Context: {instruction.context}
                      </p>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Color Palette */}
          {analysis.colorPalette?.length > 0 && (
            <Collapsible open={expandedSections.colors}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('colors')}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">Color Palette</span>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.colorPalette.length}
                  </Badge>
                </div>
                {expandedSections.colors ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-wrap gap-2 p-2">
                  {analysis.colorPalette.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg shadow-inner border border-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono text-muted-foreground">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Style References */}
          {analysis.styleReferences?.length > 0 && (
            <Collapsible open={expandedSections.styles}>
              <CollapsibleTrigger 
                onClick={() => toggleSection('styles')}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-pink-500" />
                  <span className="font-medium text-sm">Style References</span>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.styleReferences.length}
                  </Badge>
                </div>
                {expandedSections.styles ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {analysis.styleReferences.map((ref, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg border border-border"
                  >
                    <Badge className="text-xs capitalize bg-pink-500/20 text-pink-400">
                      {ref.type.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ref.description}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Floor Plan */}
          {analysis.floorPlan?.detected && (
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">Floor Plan Detected</span>
              </div>
              {analysis.floorPlan.zones?.map((zone, index) => (
                <div key={index} className="mt-2">
                  <p className="text-xs font-medium">{zone.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zone.products?.map((product, pIndex) => (
                      <Badge key={pIndex} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Design Notes */}
      {analysis.designNotes && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Design Notes</p>
          <p className="text-sm">{analysis.designNotes}</p>
        </div>
      )}
    </div>
  );
}
