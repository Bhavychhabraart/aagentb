import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, X, Plus, Link2, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductItem {
  name: string;
  imageUrl?: string;
}

interface ProductPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (products: ProductItem[]) => void;
  currentProducts: ProductItem[];
  userId?: string;
}

export function ProductPickerModal({
  open,
  onOpenChange,
  onSave,
  currentProducts,
  userId,
}: ProductPickerModalProps) {
  const [products, setProducts] = useState<ProductItem[]>(currentProducts);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!userId) {
      toast.error("Please sign in to upload images");
      return null;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const url = await uploadFile(files[0]);
      if (url) {
        setUploadedImageUrl(url);
      }
    }
  }, [userId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const url = await uploadFile(files[0]);
      if (url) {
        setUploadedImageUrl(url);
      }
    }
  };

  const addProduct = () => {
    const imageUrl = inputMode === "upload" ? uploadedImageUrl : newProductUrl.trim();

    if (!newProductName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!imageUrl) {
      toast.error("Please provide a product image");
      return;
    }

    setProducts([...products, { name: newProductName.trim(), imageUrl }]);
    setNewProductName("");
    setNewProductUrl("");
    setUploadedImageUrl(null);
    toast.success("Product added");
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onSave(products);
    onOpenChange(false);
  };

  const resetImageInput = () => {
    setNewProductUrl("");
    setUploadedImageUrl(null);
  };

  const canAddProduct = newProductName.trim() && (inputMode === "upload" ? uploadedImageUrl : newProductUrl.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add Products
          </DialogTitle>
          <DialogDescription>
            Upload product images to include in your renders. Products will appear in the generated design.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input
              placeholder="e.g., Modern Sofa, Coffee Table"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
          </div>

          <Tabs value={inputMode} onValueChange={(v) => { setInputMode(v as "upload" | "url"); resetImageInput(); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Image URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              {uploadedImageUrl ? (
                <div className="relative rounded-lg border overflow-hidden">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded product"
                    className="w-full h-40 object-contain bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setUploadedImageUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`
                    relative rounded-lg border-2 border-dashed p-8
                    transition-colors cursor-pointer
                    ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                    ${isUploading ? "pointer-events-none opacity-60" : ""}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("product-file-input")?.click()}
                >
                  <input
                    id="product-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Drop image here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/product-image.jpg"
                  value={newProductUrl}
                  onChange={(e) => setNewProductUrl(e.target.value)}
                />
              </div>
              {newProductUrl && (
                <div className="rounded-lg border overflow-hidden">
                  <img
                    src={newProductUrl}
                    alt="Product preview"
                    className="w-full h-40 object-contain bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button
            onClick={addProduct}
            className="w-full"
            disabled={isUploading || !canAddProduct}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>

          {products.length > 0 && (
            <div className="space-y-2">
              <Label>Added Products ({products.length})</Label>
              <div className="grid grid-cols-3 gap-2">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg border overflow-hidden bg-muted"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-20 object-contain"
                      />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeProduct(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-center py-1 truncate px-1">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No products added yet. Upload furniture, decor, or materials above.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
