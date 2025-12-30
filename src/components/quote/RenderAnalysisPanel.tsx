import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Package, Palette } from 'lucide-react';

interface DetectedItem {
  label: string;
  category: string;
  position_x: number;
  position_y: number;
  style: string;
  color: string;
  features?: string[];
  estimated_dimensions?: { width: number; depth: number; height: number };
  base_price_estimate: number;
  catalog_match_id: string | null;
  catalog_match_name: string | null;
  match_confidence: number;
  materials_detected: string[];
}

interface RoomAnalysis {
  room_type: string;
  style: string;
  color_palette: string[];
  lighting: string;
  total_items_detected: number;
}

interface RenderAnalysisPanelProps {
  renderUrl: string;
  detectedItems: DetectedItem[];
  roomAnalysis?: RoomAnalysis;
}

export function RenderAnalysisPanel({
  renderUrl,
  detectedItems,
  roomAnalysis
}: RenderAnalysisPanelProps) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Render Analysis
        </h4>
        {roomAnalysis && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{roomAnalysis.room_type}</Badge>
            <Badge variant="secondary">{roomAnalysis.style}</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Render with detection overlay */}
        <div className="relative aspect-video rounded-lg overflow-hidden border">
          <img 
            src={renderUrl} 
            alt="Analyzed render" 
            className="w-full h-full object-cover"
          />
          
          {/* Detection markers */}
          {detectedItems.map((item, index) => (
            <div
              key={index}
              className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                hoveredItem === index || selectedItem === index
                  ? 'bg-primary text-primary-foreground border-primary scale-125 z-10'
                  : 'bg-background/80 text-foreground border-primary/50'
              }`}
              style={{
                left: `${item.position_x}%`,
                top: `${item.position_y}%`
              }}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => setSelectedItem(selectedItem === index ? null : index)}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Detected items list */}
        <ScrollArea className="h-[200px] border rounded-lg">
          <div className="p-3 space-y-2">
            {detectedItems.map((item, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                  hoveredItem === index || selectedItem === index
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setSelectedItem(selectedItem === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  {item.catalog_match_id ? (
                    <Badge variant="secondary" className="text-xs">
                      {item.match_confidence}% match
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Custom
                    </Badge>
                  )}
                </div>

                {selectedItem === index && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Palette className="h-3 w-3" />
                      <span>Materials: {item.materials_detected.join(', ')}</span>
                    </div>
                    {item.estimated_dimensions && (
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="h-3 w-3" />
                        <span>
                          {item.estimated_dimensions.width}×
                          {item.estimated_dimensions.depth}×
                          {item.estimated_dimensions.height} cm
                        </span>
                      </div>
                    )}
                    {item.catalog_match_name && (
                      <p className="text-xs text-primary">
                        Matched: {item.catalog_match_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Color palette */}
      {roomAnalysis?.color_palette && roomAnalysis.color_palette.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Color palette:</span>
          <div className="flex gap-1">
            {roomAnalysis.color_palette.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
