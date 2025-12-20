import { useState } from 'react';
import { Plus, Minus, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatINR } from '@/utils/formatCurrency';

export interface InvoiceItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  included: boolean;
}

interface InvoiceItemsEditorProps {
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[]) => void;
}

export function InvoiceItemsEditor({ items, onItemsChange }: InvoiceItemsEditorProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const handleToggleInclude = (id: string) => {
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, included: !item.included } : item
      )
    );
  };

  const handleQuantityChange = (id: string, delta: number) => {
    onItemsChange(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + delta)) }
          : item
      )
    );
  };

  const handleQuantityInput = (id: string, value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty >= 1 && qty <= 99) {
      onItemsChange(
        items.map((item) =>
          item.id === id ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const handleAddCustomItem = () => {
    if (!customName.trim() || !customPrice.trim()) return;

    const price = parseFloat(customPrice);
    if (isNaN(price) || price < 0) return;

    const newItem: InvoiceItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory.trim() || 'Custom',
      price,
      quantity: 1,
      included: true,
    };

    onItemsChange([...items, newItem]);
    setCustomName('');
    setCustomCategory('');
    setCustomPrice('');
    setIsAddingCustom(false);
  };

  const includedItems = items.filter((item) => item.included);
  const subtotal = includedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const commission = subtotal * 0.2;
  const grandTotal = subtotal + commission;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Invoice Items</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingCustom(!isAddingCustom)}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Add Custom Item Form */}
      {isAddingCustom && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <Input
            placeholder="Item name *"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              placeholder="Price (₹) *"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddCustomItem}
              disabled={!customName.trim() || !customPrice.trim()}
              className="h-7 text-xs"
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingCustom(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <ScrollArea className="h-[200px] rounded-lg border border-border">
        <div className="p-2 space-y-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No items in project</p>
              <p className="text-xs">Add items using the button above</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                  item.included ? 'bg-muted/50' : 'bg-transparent opacity-50'
                }`}
              >
                <Checkbox
                  checked={item.included}
                  onCheckedChange={() => handleToggleInclude(item.id)}
                  className="h-4 w-4"
                />

                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-8 w-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.category}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                    className="h-6 w-10 text-center text-xs p-0"
                    min={1}
                    max={99}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleQuantityChange(item.id, 1)}
                    disabled={item.quantity >= 99}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="text-xs font-mono">{formatINR(item.price)}</p>
                  {item.quantity > 1 && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      × {item.quantity} = {formatINR(item.price * item.quantity)}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Totals */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Subtotal ({includedItems.length} item
            {includedItems.length !== 1 ? 's' : ''},{' '}
            {includedItems.reduce((sum, i) => sum + i.quantity, 0)} units)
          </span>
          <span className="font-mono">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Commission (20%)</span>
          <span className="font-mono">{formatINR(commission)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between font-medium text-primary">
          <span>Grand Total</span>
          <span className="font-mono text-lg">{formatINR(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
