import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  User, 
  FileText, 
  Download,
  Check,
  ArrowRight,
  ArrowLeft,
  Trash2,
  IndianRupee
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { generateProformaInvoice, ProjectData } from '@/services/documentService';
import { cn } from '@/lib/utils';

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
}

interface OrderFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  stagedItems: FurnitureItem[];
  projectData: ProjectData;
  onOrderComplete: () => void;
}

const STEPS = [
  { id: 1, name: 'Review Items', icon: ShoppingCart },
  { id: 2, name: 'Client Details', icon: User },
  { id: 3, name: 'Confirm Order', icon: FileText },
  { id: 4, name: 'Download', icon: Download },
];

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function OrderFlowModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  stagedItems,
  projectData,
  onOrderComplete,
}: OrderFlowModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<FurnitureItem[]>(stagedItems);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const commission = subtotal * 0.20;
  const grandTotal = subtotal + commission;

  const removeItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const canProceed = () => {
    if (step === 1) return items.length > 0;
    if (step === 2) return clientName.trim().length > 0;
    return true;
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PI-${year}${month}-${random}`;
  };

  const handleNext = async () => {
    if (step < 4) {
      if (step === 2) {
        // Moving to confirm step - generate invoice number
        setInvoiceNumber(generateInvoiceNumber());
      }
      if (step === 3) {
        // Submit order
        await submitOrder();
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const submitOrder = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const invNum = invoiceNumber || generateInvoiceNumber();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          project_id: projectId,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          invoice_number: invNum,
          subtotal,
          commission,
          grand_total: grandTotal,
          status: 'pending',
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        item_name: item.name,
        item_category: item.category,
        item_price: item.price || 0,
        item_image_url: item.imageUrl || null,
        catalog_item_id: item.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderId(order.id);
      setInvoiceNumber(invNum);
      toast({ title: 'Order created successfully!' });
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create order.' });
      setStep(3); // Go back to confirm step
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    const invoiceData: ProjectData = {
      ...projectData,
      furnitureItems: items.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        price: i.price,
        imageUrl: i.imageUrl,
        description: '',
      })),
    };
    
    const invoiceDetails = {
      clientName,
      clientEmail: clientEmail || undefined,
      clientPhone: clientPhone || undefined,
      invoiceNumber,
      invoiceDate: new Date().toLocaleDateString('en-IN'),
      notes: notes || undefined,
    };
    
    await generateProformaInvoice(invoiceData, invoiceDetails);
    toast({ title: 'Invoice downloaded!' });
  };

  const handleComplete = () => {
    onOrderComplete();
    onOpenChange(false);
    // Reset state
    setStep(1);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setNotes('');
    setOrderId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Start Order - {projectName}
          </DialogTitle>
          <DialogDescription>
            Create a new order with staged furniture items
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 rounded-lg mb-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2',
                step >= s.id ? 'text-primary' : 'text-muted-foreground'
              )}>
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step > s.id && 'bg-primary text-primary-foreground',
                  step === s.id && 'bg-primary/20 text-primary border-2 border-primary',
                  step < s.id && 'bg-muted text-muted-foreground'
                )}>
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className="text-sm hidden sm:inline">{s.name}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  'h-px w-8 mx-2',
                  step > s.id ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Review Items */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">Staged Furniture Items</h3>
              <ScrollArea className="h-[250px]">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No items staged. Add furniture to your project first.</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                      >
                        <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <p className="font-medium text-primary shrink-0">{formatINR(item.price || 0)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Step 2: Client Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email (Optional)</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@email.com"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone (Optional)</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes for this order..."
                  rows={3}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirm Order */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                {clientEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{clientEmail}</span>
                  </div>
                )}
                {clientPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{clientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-mono">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{items.length} furniture pieces</span>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Commission (20%)</span>
                  <span className="font-medium">+{formatINR(commission)}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {formatINR(grandTotal).replace('₹', '')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Download */}
          {step === 4 && (
            <div className="text-center py-8 space-y-6">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Order Created Successfully!</h3>
                <p className="text-muted-foreground">Invoice #{invoiceNumber}</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={handleDownloadInvoice} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Invoice (PDF)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          {step > 1 && step < 4 ? (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {step < 4 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? 'Creating...' : step === 3 ? 'Create Order' : 'Next'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
