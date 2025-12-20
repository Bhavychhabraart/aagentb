import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, Package, CalendarIcon, Loader2, IndianRupee, 
  Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

interface VendorRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CustomFurnitureItem | null;
  onSuccess: () => void;
}

export function VendorRequestModal({ open, onOpenChange, item, onSuccess }: VendorRequestModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setQuantity('1');
      setNotes('');
      setDeadline(undefined);
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user || !item) return;

    setIsSubmitting(true);

    try {
      // Create vendor request
      const { error } = await supabase
        .from('vendor_requests')
        .insert({
          user_id: user.id,
          furniture_name: item.item_name,
          furniture_image_url: item.item_image_url,
          furniture_description: item.item_description,
          quantity: parseInt(quantity) || 1,
          notes: notes.trim() || null,
          deadline: deadline?.toISOString().split('T')[0] || null,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      
      // Wait a moment to show success state, then close
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Failed to send request:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to send vendor request. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Vendor Request
          </DialogTitle>
          <DialogDescription>
            Request quotes from furniture vendors for this custom piece
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Request Sent!</h3>
            <p className="text-muted-foreground">
              Your request has been submitted. Vendors will respond soon.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Item Preview */}
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
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
                  <p className="text-primary font-semibold mt-1 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {item.item_price.toLocaleString('en-IN')} (estimated)
                  </p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Required</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label>Deadline for Quotes (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/50",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements, preferred materials, budget constraints..."
                rows={3}
                className="bg-muted/50"
              />
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">What happens next?</p>
                <p className="text-muted-foreground mt-1">
                  Your request will be sent to all active vendors in your network. 
                  They will receive the furniture details and can respond with quotes.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
