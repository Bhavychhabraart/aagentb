import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Loader2, RefreshCw, Package, 
  Ruler, Palette, Wrench, IndianRupee, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CustomFurnitureItem {
  id: string;
  item_name: string;
  item_category: string;
  item_description: string | null;
  item_image_url: string | null;
  item_price: number | null;
}

interface BOMAnalysisPanelProps {
  item: CustomFurnitureItem | null;
  onClose: () => void;
}

interface BOMItem {
  component: string;
  material: string;
  quantity: string;
  estimatedCost: number;
}

interface BOMData {
  components: BOMItem[];
  totalEstimate: number;
  laborCost: number;
  notes: string[];
}

export function BOMAnalysisPanel({ item, onClose }: BOMAnalysisPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bomData, setBomData] = useState<BOMData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      analyzeBOM();
    } else {
      setBomData(null);
      setError(null);
    }
  }, [item]);

  const analyzeBOM = async () => {
    if (!item) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-furniture-bom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          imageUrl: item.item_image_url,
          description: item.item_description,
          category: item.item_category,
          estimatedPrice: item.item_price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze furniture');
      }

      const data = await response.json();
      setBomData(data);
    } catch (err) {
      console.error('BOM analysis failed:', err);
      setError('Failed to analyze furniture materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAsPDF = () => {
    // For now, just show a toast - full PDF export could be implemented with jsPDF
    toast({ title: 'Export', description: 'BOM export feature coming soon!' });
  };

  const exportAsCSV = () => {
    if (!bomData || !item) return;

    const headers = ['Component', 'Material', 'Quantity', 'Estimated Cost (₹)'];
    const rows = bomData.components.map(c => [c.component, c.material, c.quantity, c.estimatedCost]);
    rows.push(['', '', 'Labor Cost', bomData.laborCost]);
    rows.push(['', '', 'Total Estimate', bomData.totalEstimate]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOM-${item.item_name.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: 'BOM exported as CSV' });
  };

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bill of Materials
          </SheetTitle>
          <SheetDescription>
            AI-powered material analysis for {item?.item_name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* Item Preview */}
          {item && (
            <div className="flex gap-4 mb-6">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.item_image_url ? (
                  <img 
                    src={item.item_image_url} 
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.item_name}</h3>
                <p className="text-sm text-muted-foreground">{item.item_category}</p>
                {item.item_price && (
                  <p className="text-primary font-semibold mt-1">
                    ₹{item.item_price.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator className="mb-6" />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing materials...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={analyzeBOM} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : bomData ? (
            <ScrollArea className="h-[calc(100vh-350px)]">
              {/* Components Table */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Material Breakdown
                </h4>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Component</th>
                        <th className="text-left p-3 font-medium">Material</th>
                        <th className="text-left p-3 font-medium">Qty</th>
                        <th className="text-right p-3 font-medium">Cost (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomData.components.map((component, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-3">{component.component}</td>
                          <td className="p-3 text-muted-foreground">{component.material}</td>
                          <td className="p-3">{component.quantity}</td>
                          <td className="p-3 text-right">
                            {component.estimatedCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-border bg-muted/30">
                        <td colSpan={3} className="p-3 font-medium">Labor Cost</td>
                        <td className="p-3 text-right">
                          {bomData.laborCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-border bg-primary/5">
                        <td colSpan={3} className="p-3 font-semibold">Total Estimate</td>
                        <td className="p-3 text-right font-semibold text-primary">
                          ₹{bomData.totalEstimate.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                {bomData.notes && bomData.notes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {bomData.notes.map((note, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={exportAsCSV} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={exportAsPDF} className="flex-1 gap-2">
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>

                {/* Refresh */}
                <Button variant="ghost" onClick={analyzeBOM} className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Re-analyze
                </Button>
              </div>
            </ScrollArea>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
