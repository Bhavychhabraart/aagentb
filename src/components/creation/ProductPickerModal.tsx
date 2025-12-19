import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, X, Plus, Link2 } from "lucide-react";

interface ProductItem {
  name: string;
  imageUrl?: string;
}

interface ProductPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (products: ProductItem[]) => void;
  currentProducts: ProductItem[];
}

export function ProductPickerModal({
  open,
  onOpenChange,
  onSave,
  currentProducts,
}: ProductPickerModalProps) {
  const [products, setProducts] = useState<ProductItem[]>(currentProducts);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");

  const addProduct = () => {
    if (!newProductName.trim()) return;

    setProducts((prev) => [
      ...prev,
      {
        name: newProductName.trim(),
        imageUrl: newProductUrl.trim() || undefined,
      },
    ]);
    setNewProductName("");
    setNewProductUrl("");
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onSave(products);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add Products
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new product form */}
          <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
            <Input
              placeholder="Product name (e.g., IKEA KARLSTAD Sofa)"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addProduct();
              }}
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Image URL (optional)"
                  value={newProductUrl}
                  onChange={(e) => setNewProductUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={addProduct} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Product list */}
          {products.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="flex-1 text-sm truncate">{product.name}</span>
                  <button
                    onClick={() => removeProduct(index)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No products added yet. Add furniture, decor, or materials above.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              {products.length > 0 ? `Save ${products.length} Product${products.length > 1 ? "s" : ""}` : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
