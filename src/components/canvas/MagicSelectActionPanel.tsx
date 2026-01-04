import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, ShoppingCart, Upload, Package, Trash2, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { MagicSelection } from './MagicSelectOverlay';

interface MagicSelectActionPanelProps {
  selection: MagicSelection;
  onClose: () => void;
  onSelectCatalog: (item: CatalogFurnitureItem) => void;
  onSelectUpload: (item: { name: string; imageUrl: string }) => void;
  onSelectCustom: (item: { name: string; imageUrl: string }) => void;
  onRemove: () => void;
  catalogItems: CatalogFurnitureItem[];
  customLibraryItems: Array<{ id: string; name: string; imageUrl: string }>;
}

export function MagicSelectActionPanel({
  selection,
  onClose,
  onSelectCatalog,
  onSelectUpload,
  onSelectCustom,
  onRemove,
  catalogItems,
  customLibraryItems,
}: MagicSelectActionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ name: string; imageUrl: string } | null>(null);

  const filteredCatalogItems = catalogItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomItems = customLibraryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const name = file.name.replace(/\.[^/.]+$/, '');
      setUploadedImage({ name, imageUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUpload = () => {
    if (uploadedImage) {
      onSelectUpload(uploadedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="glass-premium rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {selection.label.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">Replace: {selection.label}</h3>
              <p className="text-xs text-muted-foreground">
                Choose a replacement from catalog, upload, or custom library
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Replacement Preview */}
        {selection.replacement && (
          <div className="px-4 py-2 bg-green-500/10 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                Replacing with: <strong>{selection.replacement.item.name}</strong>
              </span>
              <img 
                src={selection.replacement.item.imageUrl} 
                alt={selection.replacement.item.name}
                className="w-8 h-8 rounded object-cover ml-auto"
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="catalog" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Custom Library
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="px-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="flex-1 overflow-hidden m-0 px-4 pb-4">
            <ScrollArea className="h-[300px] mt-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {filteredCatalogItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectCatalog(item)}
                    className={cn(
                      "group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent",
                      "hover:border-primary transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white font-medium truncate">{item.name}</p>
                    </div>
                  </button>
                ))}
                {filteredCatalogItems.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No items found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 overflow-hidden m-0 px-4 pb-4">
            <div className="mt-4 space-y-4">
              {!uploadedImage ? (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Click to upload product image</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img
                      src={uploadedImage.imageUrl}
                      alt={uploadedImage.name}
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      value={uploadedImage.name}
                      onChange={(e) => setUploadedImage({ ...uploadedImage, name: e.target.value })}
                      placeholder="Product name"
                    />
                    <Button onClick={handleApplyUpload} className="btn-glow">
                      Use This
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Custom Library Tab */}
          <TabsContent value="custom" className="flex-1 overflow-hidden m-0 px-4 pb-4">
            <ScrollArea className="h-[300px] mt-4">
              {filteredCustomItems.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {filteredCustomItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectCustom({ name: item.name, imageUrl: item.imageUrl })}
                      className={cn(
                        "group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent",
                        "hover:border-primary transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      )}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white font-medium truncate">{item.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No custom products yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create custom furniture in the library to use here
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Selection
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
