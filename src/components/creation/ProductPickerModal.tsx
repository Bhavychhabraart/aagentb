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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, X, Plus, Link2, Upload, Loader2, Image as ImageIcon, Library, Search, Check, Layers, Grid3X3, ShoppingBag } from "lucide-react";
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

type MainTab = "moodboard" | "individual" | "catalogue";

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
  const [mainTab, setMainTab] = useState<MainTab>("moodboard");
  
  // Library state
  const [libraryItems, setLibraryItems] = useState<ProductItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
  
  // Catalogue state (vendor products)
  const [catalogueItems, setCatalogueItems] = useState<ProductItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [selectedCatalogueIds, setSelectedCatalogueIds] = useState<Set<string>>(new Set());

  // Load library items (user's saved products)
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

  // Load catalogue items (vendor products)
  useEffect(() => {
    const loadCatalogue = async () => {
      setCatalogueLoading(true);
      try {
        const { data, error } = await supabase
          .from('vendor_products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setCatalogueItems(data?.map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.image_url || undefined,
        })) || []);
      } catch (error) {
        console.error('Failed to load catalogue:', error);
      } finally {
        setCatalogueLoading(false);
      }
    };
    
    if (open) {
      loadCatalogue();
    }
  }, [open]);

  // Filter library items by search
  const filteredLibraryItems = libraryItems.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter catalogue items by search
  const filteredCatalogueItems = catalogueItems.filter(item =>
    !catalogueSearch || item.name.toLowerCase().includes(catalogueSearch.toLowerCase())
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
      toast.error("Please upload an image file (JPG, PNG, WebP, etc.)");
      return null;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image too large. Maximum size is 5MB");
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log('Uploading to products bucket:', fileName, 'Size:', file.size);

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      console.log('Upload successful:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error("Upload error details:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to upload image";
      toast.error(errorMessage);
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

  const toggleCatalogueItem = (item: ProductItem) => {
    const newSelected = new Set(selectedCatalogueIds);
    if (item.id && newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else if (item.id) {
      newSelected.add(item.id);
    }
    setSelectedCatalogueIds(newSelected);
  };

  const addSelectedFromLibrary = () => {
    const itemsToAdd = libraryItems.filter(item => item.id && selectedLibraryIds.has(item.id));
    setProducts([...products, ...itemsToAdd]);
    setSelectedLibraryIds(new Set());
    toast.success(`Added ${itemsToAdd.length} product(s)`);
  };

  const addSelectedFromCatalogue = () => {
    const itemsToAdd = catalogueItems.filter(item => item.id && selectedCatalogueIds.has(item.id));
    setProducts([...products, ...itemsToAdd]);
    setSelectedCatalogueIds(new Set());
    toast.success(`Added ${itemsToAdd.length} product(s)`);
  };

  const handleConfirm = () => {
    // Moodboard tab implies collage mode
    const asCollage = mainTab === "moodboard";
    onSave(products, asCollage);
    onOpenChange(false);
  };

  const resetImageInput = () => {
    setNewProductUrl("");
    setUploadedImageUrl(null);
  };

  const canAddProduct = newProductName.trim() && (inputMode === "upload" ? uploadedImageUrl : newProductUrl.trim());

  const renderProductGrid = (
    items: ProductItem[],
    selectedIds: Set<string>,
    onToggle: (item: ProductItem) => void,
    loading: boolean,
    emptyMessage: string
  ) => (
    <ScrollArea className="h-[200px]">
      {loading ? (
        <div className="flex items-center justify-center h-full py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
          <Package className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 pr-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                "hover:ring-2 hover:ring-primary/50",
                item.id && selectedIds.has(item.id)
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
              
              {item.id && selectedIds.has(item.id) && (
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add Products
          </DialogTitle>
          <DialogDescription>
            Choose how you want to add products to your design.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Tabs: Moodboard, Individual Items, Catalogue */}
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="moodboard" className="flex items-center gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" />
                Moodboard
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-1.5 text-xs">
                <Grid3X3 className="h-3.5 w-3.5" />
                Individual
              </TabsTrigger>
              <TabsTrigger value="catalogue" className="flex items-center gap-1.5 text-xs">
                <ShoppingBag className="h-3.5 w-3.5" />
                Catalogue
              </TabsTrigger>
            </TabsList>

            {/* Furniture Moodboard Tab */}
            <TabsContent value="moodboard" className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">Furniture Moodboard</p>
                <p>Upload multiple furniture images to create a cohesive moodboard. All items will be combined as a collage for design inspiration.</p>
              </div>

              {/* Search library */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your saved products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {renderProductGrid(
                filteredLibraryItems,
                selectedLibraryIds,
                toggleLibraryItem,
                libraryLoading,
                libraryItems.length === 0 ? "No products in library yet" : "No products match your search"
              )}

              {selectedLibraryIds.size > 0 && (
                <Button onClick={addSelectedFromLibrary} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedLibraryIds.size} to Moodboard
                </Button>
              )}

              {/* Quick upload for moodboard */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">Or upload new images</Label>
                <div
                  className={cn(
                    "relative rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                    isUploading && "pointer-events-none opacity-60"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("moodboard-file-input")?.click()}
                >
                  <input
                    id="moodboard-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <div className="flex items-center justify-center gap-2 text-center">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? "Uploading..." : "Drop images or click to browse"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Individual Items Tab */}
            <TabsContent value="individual" className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">Individual Items</p>
                <p>Add products one by one with names. Each item will be placed separately in your design.</p>
              </div>

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

            {/* Catalogue Tab */}
            <TabsContent value="catalogue" className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-foreground mb-1">Select from Catalogue</p>
                <p>Browse and select products from our curated vendor catalogue.</p>
              </div>

              {/* Search catalogue */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search catalogue products..."
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {renderProductGrid(
                filteredCatalogueItems,
                selectedCatalogueIds,
                toggleCatalogueItem,
                catalogueLoading,
                catalogueItems.length === 0 ? "No catalogue products available" : "No products match your search"
              )}

              {selectedCatalogueIds.size > 0 && (
                <Button onClick={addSelectedFromCatalogue} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedCatalogueIds.size} from Catalogue
                </Button>
              )}
            </TabsContent>
          </Tabs>

          {/* Added Products */}
          {products.length > 0 && (
            <div className="space-y-2 border-t pt-4">
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
                    <p className="text-[10px] text-center truncate px-1 py-0.5 bg-muted">
                      {product.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={products.length === 0}>
              Save ({products.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
