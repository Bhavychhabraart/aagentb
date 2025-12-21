import { useState, useCallback, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, X, Plus, Link2, Upload, Loader2, Image as ImageIcon, Library, Search, Check, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ProductItem {
  id?: string;
  name: string;
  imageUrl?: string;
}

interface ProductPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (products: ProductItem[], asCollage: boolean) => void;
  currentProducts: ProductItem[];
  userId?: string;
  projectId?: string;
}

export function ProductPickerModal({
  open,
  onOpenChange,
  onSave,
  currentProducts,
  userId,
  projectId,
}: ProductPickerModalProps) {
  const [products, setProducts] = useState<ProductItem[]>(currentProducts);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"add" | "library">("add");
  const [asCollage, setAsCollage] = useState(false);
  
  // Library state
  const [libraryItems, setLibraryItems] = useState<ProductItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());

  // Load library items
  useEffect(() => {
    const loadLibrary = async () => {
      if (!userId) return;
      
      setLibraryLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setLibraryItems(data?.map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url || undefined,
        })) || []);
      } catch (error) {
        console.error('Failed to load library:', error);
      } finally {
        setLibraryLoading(false);
      }
    };
    
    if (open) {
      loadLibrary();
    }
  }, [userId, open]);

  // Filter library items by search
  const filteredLibraryItems = libraryItems.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const toggleLibraryItem = (item: ProductItem) => {
    const newSelected = new Set(selectedLibraryIds);
    if (item.id && newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else if (item.id) {
      newSelected.add(item.id);
    }
    setSelectedLibraryIds(newSelected);
  };

  const addSelectedFromLibrary = () => {
    const itemsToAdd = libraryItems.filter(item => item.id && selectedLibraryIds.has(item.id));
    setProducts([...products, ...itemsToAdd]);
    setSelectedLibraryIds(new Set());
    toast.success(`Added ${itemsToAdd.length} product(s)`);
  };

  const handleConfirm = () => {
    onSave(products, asCollage);
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
            Upload product images or select from your library. Products will appear in the generated design.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Tabs: Add New vs Library */}
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "add" | "library")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Library ({libraryItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Add New Tab */}
            <TabsContent value="add" className="mt-4 space-y-4">
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
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  {uploadedImageUrl ? (
                    <div className="relative rounded-lg border overflow-hidden">
                      <img
                        src={uploadedImageUrl}
                        alt="Uploaded product"
                        className="w-full h-32 object-contain bg-muted"
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
                      className={cn(
                        "relative rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                        isUploading && "pointer-events-none opacity-60"
                      )}
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
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Drop image or click to browse</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-3">
                  <Input
                    placeholder="https://example.com/product-image.jpg"
                    value={newProductUrl}
                    onChange={(e) => setNewProductUrl(e.target.value)}
                  />
                  {newProductUrl && (
                    <div className="rounded-lg border overflow-hidden">
                      <img
                        src={newProductUrl}
                        alt="Product preview"
                        className="w-full h-32 object-contain bg-muted"
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
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library" className="mt-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Library Grid */}
              <ScrollArea className="h-[200px]">
                {libraryLoading ? (
                  <div className="flex items-center justify-center h-full py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLibraryItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <Library className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {libraryItems.length === 0 ? "No products in library yet" : "No products match your search"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 pr-3">
                    {filteredLibraryItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleLibraryItem(item)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          "hover:ring-2 hover:ring-primary/50",
                          item.id && selectedLibraryIds.has(item.id)
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border/50"
                        )}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        {item.id && selectedLibraryIds.has(item.id) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                          <p className="text-[10px] text-white truncate">{item.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedLibraryIds.size > 0 && (
                <Button onClick={addSelectedFromLibrary} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedLibraryIds.size} Selected
                </Button>
              )}
            </TabsContent>
          </Tabs>

          {/* Added Products */}
          {products.length > 0 && (
            <div className="space-y-2">
              <Label>Added Products ({products.length})</Label>
              <div className="grid grid-cols-4 gap-2">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg border overflow-hidden bg-muted"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-16 object-contain"
                      />
                    ) : (
                      <div className="w-full h-16 flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
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
                    <p className="text-[10px] text-center py-1 truncate px-1">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collage Toggle */}
          {products.length > 1 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Combine as Collage</p>
                  <p className="text-xs text-muted-foreground">Merge all products into a single reference image</p>
                </div>
              </div>
              <Switch checked={asCollage} onCheckedChange={setAsCollage} />
            </div>
          )}

          {products.length === 0 && mainTab === "add" && (
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
