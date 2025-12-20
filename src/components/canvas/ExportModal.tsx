import { useState, useEffect } from 'react';
import { FileText, Presentation, Download, Loader2, IndianRupee, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  generatePPT,
  generateProformaInvoice,
  calculateTotals,
  formatINR,
  generateInvoiceNumber,
  ProjectData,
  InvoiceDetails,
  FurnitureItem,
} from '@/services/documentService';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData: ProjectData;
}

export function ExportModal({ open, onOpenChange, projectData }: ExportModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'ppt' | 'invoice'>('ppt');
  
  // Invoice form state
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Generate invoice number on mount
  useEffect(() => {
    if (open) {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, [open]);
  
  const totals = calculateTotals(projectData.furnitureItems);
  
  const handleGeneratePPT = async () => {
    setIsGenerating(true);
    try {
      await generatePPT(projectData);
      toast({
        title: 'PPT Generated',
        description: 'Your presentation has been downloaded.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('PPT generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate the presentation.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerateInvoice = async () => {
    if (!clientName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Client Name Required',
        description: 'Please enter the client name.',
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const invoiceDetails: InvoiceDetails = {
        clientName: clientName.trim(),
        clientAddress: clientAddress.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        invoiceNumber,
        invoiceDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        notes: notes.trim() || undefined,
      };
      
      await generateProformaInvoice(projectData, invoiceDetails);
      toast({
        title: 'Invoice Generated',
        description: 'Your proforma invoice has been downloaded.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Invoice generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate the invoice.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-primary" />
            Export Project
          </DialogTitle>
          <DialogDescription>
            Generate a professional presentation or proforma invoice
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ppt' | 'invoice')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ppt" className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              Presentation
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proforma Invoice
            </TabsTrigger>
          </TabsList>
          
          {/* PPT Tab */}
          <TabsContent value="ppt" className="space-y-4 mt-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-medium mb-3">Presentation Contents</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Title slide with project name
                </li>
                {projectData.layoutImageUrl && (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    2D Floor Plan layout
                  </li>
                )}
                {projectData.styleRefUrls && projectData.styleRefUrls.length > 0 && (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {projectData.styleRefUrls.length} Style reference{projectData.styleRefUrls.length > 1 ? 's' : ''}
                  </li>
                )}
                {projectData.renderUrls.length > 0 && (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {projectData.renderUrls.length} Generated render{projectData.renderUrls.length > 1 ? 's' : ''}
                  </li>
                )}
                {projectData.furnitureItems.length > 0 && (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {projectData.furnitureItems.length} Furniture item{projectData.furnitureItems.length > 1 ? 's' : ''}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Pricing summary with 20% commission
                    </li>
                  </>
                )}
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Thank you slide
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={handleGeneratePPT} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Presentation className="mr-2 h-4 w-4" />
                  Download PPT
                </>
              )}
            </Button>
          </TabsContent>
          
          {/* Invoice Tab */}
          <TabsContent value="invoice" className="space-y-4 mt-4">
            {/* Invoice Preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Invoice Summary</h4>
                <span className="text-xs text-muted-foreground font-mono">{invoiceNumber}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                {projectData.furnitureItems.slice(0, 3).map((item, idx) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate max-w-[200px]">{item.name}</span>
                    <span className="font-mono">{formatINR(item.price)}</span>
                  </div>
                ))}
                {projectData.furnitureItems.length > 3 && (
                  <div className="text-muted-foreground text-xs">
                    + {projectData.furnitureItems.length - 3} more items
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatINR(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Commission (20%)</span>
                  <span className="font-mono">{formatINR(totals.commission)}</span>
                </div>
                <div className="flex justify-between font-medium text-primary pt-1">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Grand Total
                  </span>
                  <span className="font-mono text-lg">{formatINR(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
            
            {/* Client Details Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone</Label>
                  <Input
                    id="clientPhone"
                    placeholder="+91 98765 43210"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Address</Label>
                <Input
                  id="clientAddress"
                  placeholder="Enter client address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateInvoice} 
              disabled={isGenerating || projectData.furnitureItems.length === 0}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Invoice
                </>
              )}
            </Button>
            
            {projectData.furnitureItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Add furniture items to generate an invoice
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
