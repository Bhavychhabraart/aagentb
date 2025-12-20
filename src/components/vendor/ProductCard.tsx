import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, IndianRupee, Package } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VendorProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  sku: string | null;
  is_active: boolean;
}

interface ProductCardProps {
  product: VendorProduct;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
}

export function ProductCard({ product, onEdit, onDelete, onToggleActive }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group">
      {/* Image */}
      <div className="aspect-square relative bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Category Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 text-xs"
        >
          {product.category}
        </Badge>

        {/* Active/Inactive Badge */}
        <Badge 
          variant={product.is_active ? 'default' : 'outline'}
          className={`absolute top-2 right-2 text-xs ${
            product.is_active ? 'bg-green-500' : 'bg-muted'
          }`}
        >
          {product.is_active ? 'Active' : 'Inactive'}
        </Badge>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{product.name}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-1 mb-1">{product.name}</h3>
        
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center text-primary font-semibold">
            <IndianRupee className="h-4 w-4" />
            <span>{product.price.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Active</span>
            <Switch
              checked={product.is_active}
              onCheckedChange={onToggleActive}
              className="scale-75"
            />
          </div>
        </div>

        {product.sku && (
          <p className="text-[10px] text-muted-foreground mt-2">
            SKU: {product.sku}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
