import { motion } from 'framer-motion';
import { FileText, Download, Send, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { BOQData } from '@/types/wizard';

interface BOQPanelProps {
  boqData: BOQData;
  isOpen: boolean;
  onClose: () => void;
}

export function BOQPanel({ boqData, isOpen, onClose }: BOQPanelProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Bill of Quantities</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Items List */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-4 space-y-3">
          {boqData.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No items in BOQ yet</p>
              <p className="text-sm">Add products to the canvas to see them here</p>
            </div>
          ) : (
            boqData.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                {/* Image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.isCustom ? (
                        <Sparkles className="w-5 h-5 text-primary" />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.isCustom && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatPrice(item.totalPrice)}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unitPrice)} each
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(boqData.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Design Fee ({boqData.designFeePercent}%)
            </span>
            <span>{formatPrice(boqData.designFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span className="text-primary">{formatPrice(boqData.grandTotal)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button className="flex-1 gap-2">
            <Send className="w-4 h-4" />
            Send to Client
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
