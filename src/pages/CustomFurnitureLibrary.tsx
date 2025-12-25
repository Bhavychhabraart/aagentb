import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, Plus, Eye, Edit, Trash2, 
  FileText, Send, Loader2, Package, Grid3X3, List, X, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BOMAnalysisPanel } from '@/components/creation/BOMAnalysisPanel';
import { VendorRequestModal } from '@/components/creation/VendorRequestModal';
import { ProductImageEditor } from '@/components/creation/ProductImageEditor';

interface CustomFurnitureItem {
  id: string;
  catalog_item_id: string;
  item_name: string;
  item_category: string;
  item_description: string | null;
  item_image_url: string | null;
  item_price: number | null;
  project_id: string;
  created_at: string;
}

const CATEGORIES = [
  'All',
  'Furniture',
  'Seating',
  'Tables',
  'Storage',
  'Beds',
  'Lighting',
  'Rugs',
  'Art',
  'Decor',
  'Tiles',
  'Bath Ware',
  'Vanity',
  'Wardrobe',
  'Kitchen',
  'Outdoor',
  'Office',
  'Custom'
];

export default function CustomFurnitureLibrary() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [items, setItems] = useState<CustomFurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewingItem, setViewingItem] = useState<CustomFurnitureItem | null>(null);
  const [bomItem, setBomItem] = useState<CustomFurnitureItem | null>(null);
  const [vendorRequestItem, setVendorRequestItem] = useState<CustomFurnitureItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CustomFurnitureItem | null>(null);
  const [editingImageItem, setEditingImageItem] = useState<CustomFurnitureItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCustomFurniture();
    }
  }, [user]);

  const fetchCustomFurniture = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staged_furniture')
        .select('*')
        .like('catalog_item_id', 'custom-%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch custom furniture:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load custom furniture.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('staged_furniture')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      toast({ title: 'Deleted', description: 'Custom furniture item deleted.' });
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.item_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalValue = items.reduce((sum, item) => sum + (item.item_price || 0), 0);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Custom Furniture Library</h1>
                <p className="text-sm text-muted-foreground">
                  {items.length} items • Total value: ₹{totalValue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/custom-furniture/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-6 py-4 border-b border-border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search custom furniture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-muted/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px] bg-muted/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {items.length === 0 ? 'No custom furniture yet' : 'No items match your search'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {items.length === 0 
                ? 'Create your first custom furniture piece using AI'
                : 'Try adjusting your filters or search query'}
            </p>
            {items.length === 0 && (
              <Button onClick={() => navigate('/custom-furniture/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Custom Furniture
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map(item => (
              <FurnitureCard 
                key={item.id} 
                item={item}
                onView={() => setViewingItem(item)}
                onEdit={() => navigate(`/custom-furniture/create?edit=${item.id}`)}
                onEditImage={() => setEditingImageItem(item)}
                onDelete={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                onBOM={() => setBomItem(item)}
                onVendorRequest={() => setVendorRequestItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <FurnitureListItem
                key={item.id}
                item={item}
                onView={() => setViewingItem(item)}
                onEdit={() => navigate(`/custom-furniture/create?edit=${item.id}`)}
                onEditImage={() => setEditingImageItem(item)}
                onDelete={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                onBOM={() => setBomItem(item)}
                onVendorRequest={() => setVendorRequestItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* View Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onClick={() => setViewingItem(null)}>
          <div className="max-w-2xl w-full bg-card rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img 
              src={viewingItem.item_image_url || '/placeholder.svg'} 
              alt={viewingItem.item_name}
              className="w-full aspect-square object-contain bg-muted"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">{viewingItem.item_name}</h2>
                <Badge>{viewingItem.item_category}</Badge>
              </div>
              {viewingItem.item_description && (
                <p className="text-muted-foreground mb-4">{viewingItem.item_description}</p>
              )}
              {viewingItem.item_price && (
                <p className="text-2xl font-bold text-primary">₹{viewingItem.item_price.toLocaleString('en-IN')}</p>
              )}
              <div className="flex gap-2 mt-6">
                <Button onClick={() => { setViewingItem(null); navigate(`/custom-furniture/create?edit=${viewingItem.id}`); }} className="flex-1 gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => { setViewingItem(null); setBomItem(viewingItem); }} className="gap-2">
                  <FileText className="h-4 w-4" />
                  BOM
                </Button>
                <Button variant="outline" onClick={() => { setViewingItem(null); setVendorRequestItem(viewingItem); }} className="gap-2">
                  <Send className="h-4 w-4" />
                  Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOM Analysis Panel */}
      <BOMAnalysisPanel
        item={bomItem}
        onClose={() => setBomItem(null)}
      />

      {/* Vendor Request Modal */}
      <VendorRequestModal
        open={!!vendorRequestItem}
        onOpenChange={(open) => !open && setVendorRequestItem(null)}
        item={vendorRequestItem}
        onSuccess={() => { setVendorRequestItem(null); toast({ title: 'Request sent to vendors' }); }}
      />

      {/* Product Image Editor */}
      {editingImageItem && editingImageItem.item_image_url && (
        <ProductImageEditor
          open={!!editingImageItem}
          onOpenChange={(open) => !open && setEditingImageItem(null)}
          imageUrl={editingImageItem.item_image_url}
          productName={editingImageItem.item_name}
          productCategory={editingImageItem.item_category}
          onSave={async (newImageUrl) => {
            try {
              const { error } = await supabase
                .from('staged_furniture')
                .update({ item_image_url: newImageUrl })
                .eq('id', editingImageItem.id);
              
              if (error) throw error;
              
              setItems(prev => prev.map(item => 
                item.id === editingImageItem.id 
                  ? { ...item, item_image_url: newImageUrl }
                  : item
              ));
              toast({ title: 'Image updated!' });
            } catch (error) {
              console.error('Failed to update image:', error);
              toast({ variant: 'destructive', title: 'Error', description: 'Failed to save image.' });
            }
          }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom furniture?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.item_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FurnitureCardProps {
  item: CustomFurnitureItem;
  onView: () => void;
  onEdit: () => void;
  onEditImage: () => void;
  onDelete: () => void;
  onBOM: () => void;
  onVendorRequest: () => void;
}

function FurnitureCard({ item, onView, onEdit, onEditImage, onDelete, onBOM, onVendorRequest }: FurnitureCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="relative aspect-square">
        {item.item_image_url ? (
          <img 
            src={item.item_image_url} 
            alt={item.item_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" onClick={onView} title="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={onEditImage} title="Edit Image">
            <Wand2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={onBOM} title="BOM Analysis">
            <FileText className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={onVendorRequest} title="Send to Vendor">
            <Send className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={onDelete} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Badge className="absolute top-2 left-2 text-[10px]">{item.item_category}</Badge>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate">{item.item_name}</h3>
        {item.item_price && (
          <p className="text-primary font-semibold text-sm mt-1">
            ₹{item.item_price.toLocaleString('en-IN')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FurnitureListItem({ item, onView, onEdit, onEditImage, onDelete, onBOM, onVendorRequest }: FurnitureCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
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
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate">{item.item_name}</h3>
            <Badge variant="secondary" className="text-[10px]">{item.item_category}</Badge>
          </div>
          {item.item_description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{item.item_description}</p>
          )}
          {item.item_price && (
            <p className="text-primary font-semibold text-sm mt-1">
              ₹{item.item_price.toLocaleString('en-IN')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onView} className="gap-1">
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={onEditImage} className="gap-1">
            <Wand2 className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onBOM} className="gap-1">
            <FileText className="h-4 w-4" />
            BOM
          </Button>
          <Button size="sm" variant="ghost" onClick={onVendorRequest} className="gap-1">
            <Send className="h-4 w-4" />
            Request
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
