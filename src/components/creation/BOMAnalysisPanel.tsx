import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Loader2, RefreshCw, Package, 
  Ruler, Palette, Wrench, IndianRupee, AlertCircle, Plus, Trash2, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedComponents, setEditedComponents] = useState<BOMItem[]>([]);
  const [editedLaborCost, setEditedLaborCost] = useState(0);

  useEffect(() => {
    if (item) {
      analyzeBOM();
    } else {
      setBomData(null);
      setError(null);
      setIsEditing(false);
    }
  }, [item]);

  useEffect(() => {
    if (bomData) {
      setEditedComponents([...bomData.components]);
      setEditedLaborCost(bomData.laborCost);
    }
  }, [bomData]);

  const analyzeBOM = async () => {
    if (!item) return;
    
    setLoading(true);
    setError(null);
    setIsEditing(false);

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

  const calculateTotal = () => {
    const componentsCost = editedComponents.reduce((sum, c) => sum + c.estimatedCost, 0);
    return componentsCost + editedLaborCost;
  };

  const handleComponentChange = (index: number, field: keyof BOMItem, value: string | number) => {
    const newComponents = [...editedComponents];
    if (field === 'estimatedCost') {
      newComponents[index] = { ...newComponents[index], [field]: Number(value) || 0 };
    } else {
      newComponents[index] = { ...newComponents[index], [field]: value };
    }
    setEditedComponents(newComponents);
  };

  const addComponent = () => {
    setEditedComponents([
      ...editedComponents,
      { component: 'New Component', material: '', quantity: '1', estimatedCost: 0 }
    ]);
  };

  const removeComponent = (index: number) => {
    setEditedComponents(editedComponents.filter((_, i) => i !== index));
  };

  const saveChanges = () => {
    if (bomData) {
      setBomData({
        ...bomData,
        components: editedComponents,
        laborCost: editedLaborCost,
        totalEstimate: calculateTotal(),
      });
    }
    setIsEditing(false);
    toast({ title: 'BOM Updated', description: 'Changes saved successfully.' });
  };

  const exportAsPDF = async () => {
    const dataToExport = isEditing ? { components: editedComponents, laborCost: editedLaborCost, notes: bomData?.notes || [] } : bomData;
    if (!dataToExport || !item) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text('Bill of Materials', 14, 20);
    
    // Item details
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Product: ${item.item_name}`, 14, 32);
    doc.text(`Category: ${item.item_category}`, 14, 40);
    if (item.item_price) {
      doc.text(`Listed Price: ₹${item.item_price.toLocaleString('en-IN')}`, 14, 48);
    }
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 60, 20);
    
    // Components table
    const tableData = dataToExport.components.map(c => [
      c.component,
      c.material,
      c.quantity,
      `₹${c.estimatedCost.toLocaleString('en-IN')}`
    ]);
    
    // Add labor and total rows
    tableData.push(['', '', 'Labor Cost', `₹${dataToExport.laborCost.toLocaleString('en-IN')}`]);
    const total = isEditing ? calculateTotal() : (bomData?.totalEstimate || 0);
    tableData.push(['', '', 'Total Estimate', `₹${total.toLocaleString('en-IN')}`]);
    
    autoTable(doc, {
      startY: item.item_price ? 56 : 48,
      head: [['Component', 'Material', 'Quantity', 'Cost']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      footStyles: {
        fontStyle: 'bold'
      },
      columnStyles: {
        3: { halign: 'right' }
      },
      didParseCell: (data) => {
        // Style the total row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [239, 246, 255];
        }
        // Style the labor row
        if (data.row.index === tableData.length - 2) {
          data.cell.styles.fillColor = [249, 250, 251];
        }
      }
    });
    
    // Notes section
    if (dataToExport.notes && dataToExport.notes.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text('Notes:', 14, finalY + 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      dataToExport.notes.forEach((note, index) => {
        doc.text(`• ${note}`, 18, finalY + 25 + (index * 8));
      });
    }
    
    // Save
    const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
    doc.save(formatDownloadFilename('bom', item.item_name, 'pdf'));
    toast({ title: 'Exported', description: 'BOM exported as PDF' });
  };

  const exportAsCSV = async () => {
    const dataToExport = isEditing ? { components: editedComponents, laborCost: editedLaborCost } : bomData;
    if (!dataToExport || !item) return;

    const { formatDownloadFilename } = await import('@/utils/formatDownloadFilename');
    const headers = ['Component', 'Material', 'Quantity', 'Estimated Cost (₹)'];
    const rows = dataToExport.components.map(c => [c.component, c.material, c.quantity, c.estimatedCost]);
    rows.push(['', '', 'Labor Cost', dataToExport.laborCost]);
    rows.push(['', '', 'Total Estimate', calculateTotal()]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formatDownloadFilename('bom', item.item_name, 'csv');
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: 'BOM exported as CSV' });
  };

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[550px] sm:max-w-[550px]">
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
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Material Breakdown
                  </h4>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => isEditing ? saveChanges() : setIsEditing(true)}
                    className="gap-1.5"
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </>
                    ) : (
                      'Edit BOM'
                    )}
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Component</th>
                        <th className="text-left p-3 font-medium">Material</th>
                        <th className="text-left p-3 font-medium">Qty</th>
                        <th className="text-right p-3 font-medium">Cost (₹)</th>
                        {isEditing && <th className="w-10"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? editedComponents : bomData.components).map((component, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2">
                            {isEditing ? (
                              <Input
                                value={component.component}
                                onChange={(e) => handleComponentChange(index, 'component', e.target.value)}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <span className="px-1">{component.component}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <Input
                                value={component.material}
                                onChange={(e) => handleComponentChange(index, 'material', e.target.value)}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <span className="px-1 text-muted-foreground">{component.material}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <Input
                                value={component.quantity}
                                onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                                className="h-8 text-sm w-16"
                              />
                            ) : (
                              <span className="px-1">{component.quantity}</span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={component.estimatedCost}
                                onChange={(e) => handleComponentChange(index, 'estimatedCost', e.target.value)}
                                className="h-8 text-sm w-24 ml-auto text-right"
                              />
                            ) : (
                              <span className="px-1">{component.estimatedCost.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeComponent(index)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                      
                      {isEditing && (
                        <tr className="border-t border-border">
                          <td colSpan={5} className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={addComponent}
                              className="w-full gap-1.5 text-muted-foreground"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Component
                            </Button>
                          </td>
                        </tr>
                      )}
                      
                      <tr className="border-t border-border bg-muted/30">
                        <td colSpan={3} className="p-3 font-medium">Labor Cost</td>
                        <td className="p-3 text-right" colSpan={isEditing ? 2 : 1}>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editedLaborCost}
                              onChange={(e) => setEditedLaborCost(Number(e.target.value) || 0)}
                              className="h-8 text-sm w-24 ml-auto text-right"
                            />
                          ) : (
                            bomData.laborCost.toLocaleString('en-IN')
                          )}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-border bg-primary/5">
                        <td colSpan={3} className="p-3 font-semibold">Total Estimate</td>
                        <td className="p-3 text-right font-semibold text-primary" colSpan={isEditing ? 2 : 1}>
                          ₹{(isEditing ? calculateTotal() : bomData.totalEstimate).toLocaleString('en-IN')}
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