import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Plus, Eye, Trash2, 
  FileText, Send, Loader2, Package, X, Wand2,
  Share2, Globe, Upload, Palette, Layers, Settings,
  MoreVertical, Pencil, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BOMAnalysisPanel } from '@/components/creation/BOMAnalysisPanel';
import { VendorRequestModal } from '@/components/creation/VendorRequestModal';
import { ProductImageEditor } from '@/components/creation/ProductImageEditor';
import { ShareProductModal } from '@/components/library/ShareProductModal';
import { CustomMaterialUploader } from '@/components/library/CustomMaterialUploader';

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
  is_public?: boolean;
  share_token?: string | null;
}

interface CustomMaterial {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  image_url: string;
  color_hex: string | null;
  is_public: boolean;
  properties: Record<string, boolean>;
  created_at: string;
}

type TabType = 'products' | 'materials' | 'shared';

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

const sidebarItems = [
  { id: 'products' as TabType, icon: Package, label: 'Products' },
  { id: 'materials' as TabType, icon: Palette, label: 'Materials' },
  { id: 'shared' as TabType, icon: Share2, label: 'Shared' },
];

const stylesSuggestions = ['BAUHAUS MINIMAL', 'FLUID BRUTALIST', 'CYBER ORGANIC', 'SCANDINAVIAN WARM'];

export default function CustomFurnitureLibrary() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [items, setItems] = useState<CustomFurnitureItem[]>([]);
  const [sharedItems, setSharedItems] = useState<CustomFurnitureItem[]>([]);
  const [materials, setMaterials] = useState<CustomMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewingItem, setViewingItem] = useState<CustomFurnitureItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CustomFurnitureItem | CustomMaterial | null>(null);
  const [bomItem, setBomItem] = useState<CustomFurnitureItem | null>(null);
  const [vendorRequestItem, setVendorRequestItem] = useState<CustomFurnitureItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CustomFurnitureItem | null>(null);
  const [editingImageItem, setEditingImageItem] = useState<CustomFurnitureItem | null>(null);
  const [sharingItem, setSharingItem] = useState<CustomFurnitureItem | null>(null);
  const [materialUploaderOpen, setMaterialUploaderOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [createPrompt, setCreatePrompt] = useState('');

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
      // Fetch user's own products
      const { data, error } = await supabase
        .from('staged_furniture')
        .select('*')
        .like('catalog_item_id', 'custom-%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);

      // Fetch public/shared products from others
      const { data: publicData } = await supabase
        .from('staged_furniture')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      setSharedItems(publicData || []);

      // Fetch custom materials
      const { data: materialsData } = await supabase
        .from('custom_materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      setMaterials((materialsData as CustomMaterial[]) || []);
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
      if (selectedProduct && 'id' in selectedProduct && selectedProduct.id === itemToDelete.id) {
        setSelectedProduct(null);
      }
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

  const filteredSharedItems = sharedItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.item_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreate = () => {
    if (createPrompt.trim()) {
      navigate(`/custom-furniture/create?prompt=${encodeURIComponent(createPrompt)}`);
    } else {
      navigate('/custom-furniture/create');
    }
  };

  const handleStyleSuggestion = (style: string) => {
    setCreatePrompt(`${style.toLowerCase()} style furniture piece`);
  };

  const totalValue = items.reduce((sum, item) => sum + (item.item_price || 0), 0);

  const getCurrentItems = () => {
    if (activeTab === 'products') return filteredItems;
    if (activeTab === 'shared') return filteredSharedItems;
    return [];
  };

  const isFurnitureItem = (item: CustomFurnitureItem | CustomMaterial): item is CustomFurnitureItem => {
    return 'item_name' in item;
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4dd6a8]" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f1419] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0f1419]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-9 h-9 bg-gradient-to-br from-[#4dd6a8] to-[#3ec99b] rounded-lg flex items-center justify-center shadow-lg shadow-[#4dd6a8]/20">
            <Layers className="w-5 h-5 text-[#0f1419]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">GENERATIVE FURNITURE LAB</h1>
            <p className="text-[10px] text-white/50 tracking-widest">
              {items.length} items • ₹{totalValue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <button className="text-white font-medium border-b-2 border-[#4dd6a8] pb-1">GALLERY</button>
          <button className="text-white/50 hover:text-white transition-colors">ARCHIVE</button>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button 
            className="bg-[#4dd6a8] hover:bg-[#3ec99b] text-[#0f1419] font-semibold px-4 text-sm"
            onClick={() => navigate('/custom-furniture/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            CREATE NEW
          </Button>
        </div>
      </header>

      {/* Search Bar (Collapsible) */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-white/10 bg-[#1a2027]/50">
          <div className="flex items-center gap-4 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0f1419] border-white/10 text-white placeholder:text-white/40 focus:border-[#4dd6a8]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#0f1419] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-[#4dd6a8] focus:outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Icon Sidebar */}
        <div className="w-16 border-r border-white/10 py-4 flex flex-col gap-2 items-center bg-[#0f1419]">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedProduct(null);
              }}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative",
                activeTab === item.id
                  ? "bg-[#4dd6a8] text-[#0f1419] shadow-lg shadow-[#4dd6a8]/30"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#1a2027] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </span>
            </button>
          ))}
          <div className="flex-1" />
          {activeTab === 'materials' && (
            <button
              onClick={() => setMaterialUploaderOpen(true)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors group relative"
            >
              <Upload className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#1a2027] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Upload Material
              </span>
            </button>
          )}
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4dd6a8]" />
            </div>
          ) : activeTab === 'materials' ? (
            /* Materials Tab */
            filteredMaterials.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/50">
                <Palette className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No custom materials yet</p>
                <p className="text-sm mt-2">Upload your first custom material texture</p>
                <Button 
                  className="mt-4 bg-[#4dd6a8] hover:bg-[#3ec99b] text-[#0f1419]"
                  onClick={() => setMaterialUploaderOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Material
                </Button>
              </div>
            ) : selectedProduct && !isFurnitureItem(selectedProduct) ? (
              /* Material Detail View */
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-br from-[#0f1419] to-[#1a2027]">
                  <div className="relative max-w-2xl w-full aspect-square rounded-2xl overflow-hidden bg-[#1a2027] border border-white/10 shadow-2xl">
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-80 border-l border-white/10 bg-[#1a2027]/50 overflow-y-auto p-5">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold tracking-widest text-white/70">MATERIAL SPECS</h3>
                      {selectedProduct.is_public && (
                        <Badge className="bg-[#4dd6a8]/20 text-[#4dd6a8] text-[10px] border-0">PUBLIC</Badge>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedProduct.name}</h2>
                      <p className="text-sm text-white/50 mt-1">{selectedProduct.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                      <span className="text-xs text-white/50">CATEGORY</span>
                      <Badge variant="outline" className="border-white/20 text-white/80">
                        {selectedProduct.category}
                      </Badge>
                    </div>
                    {selectedProduct.subcategory && (
                      <div className="flex items-center justify-between py-3 border-t border-white/10">
                        <span className="text-xs text-white/50">SUBCATEGORY</span>
                        <span className="text-sm">{selectedProduct.subcategory}</span>
                      </div>
                    )}
                    {selectedProduct.color_hex && (
                      <div className="flex items-center justify-between py-3 border-t border-white/10">
                        <span className="text-xs text-white/50">COLOR</span>
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-white/20"
                          style={{ backgroundColor: selectedProduct.color_hex }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Materials Grid */
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="group relative bg-[#1a2027] rounded-xl overflow-hidden border border-white/5 hover:border-[#4dd6a8]/50 transition-all cursor-pointer"
                      onClick={() => setSelectedProduct(material)}
                    >
                      <div className="aspect-square bg-[#0f1419] overflow-hidden">
                        <img
                          src={material.image_url}
                          alt={material.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium truncate flex-1">{material.name}</h3>
                          {material.is_public && <Globe className="w-3 h-3 text-[#4dd6a8]" />}
                        </div>
                        <p className="text-xs text-white/50 mt-1">{material.category}</p>
                      </div>
                      {material.color_hex && (
                        <div 
                          className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
                          style={{ backgroundColor: material.color_hex }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : getCurrentItems().length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-white/50">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">
                {activeTab === 'shared' ? 'No shared products' : 'No custom products yet'}
              </p>
              <p className="text-sm mt-2">
                {activeTab === 'shared' 
                  ? 'Products shared publicly by the community will appear here'
                  : 'Create your first custom product using AI'}
              </p>
              {activeTab === 'products' && (
                <Button 
                  className="mt-4 bg-[#4dd6a8] hover:bg-[#3ec99b] text-[#0f1419]"
                  onClick={() => navigate('/custom-furniture/create')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              )}
            </div>
          ) : selectedProduct && isFurnitureItem(selectedProduct) ? (
            /* Featured Product View */
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-br from-[#0f1419] to-[#1a2027]">
                <div className="relative max-w-2xl w-full aspect-square rounded-2xl overflow-hidden bg-[#1a2027] border border-white/10 shadow-2xl">
                  <img 
                    src={selectedProduct.item_image_url || '/placeholder.svg'} 
                    alt={selectedProduct.item_name}
                    className="w-full h-full object-contain p-8" 
                  />
                  {/* Hotspot markers */}
                  <div className="absolute top-1/4 left-1/3 w-4 h-4 rounded-full bg-[#4dd6a8] animate-pulse shadow-lg shadow-[#4dd6a8]/50 cursor-pointer" />
                  <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-[#4dd6a8] animate-pulse shadow-lg shadow-[#4dd6a8]/50 cursor-pointer" style={{ animationDelay: '0.5s' }} />
                  
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Specs Panel */}
              <div className="w-80 border-l border-white/10 bg-[#1a2027]/50 overflow-y-auto">
                <div className="p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-widest text-white/70">TECHNICAL SPECS</h3>
                    <Badge className="bg-[#4dd6a8]/20 text-[#4dd6a8] text-[10px] border-0">LIVE</Badge>
                  </div>

                  {/* Eco Score Circle */}
                  <div className="flex justify-center py-2">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                        <circle 
                          cx="48" cy="48" r="44" 
                          stroke="#4dd6a8" 
                          strokeWidth="4" 
                          fill="none"
                          strokeDasharray="228 276" 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">82</span>
                        <span className="text-[8px] text-white/50 tracking-widest">ECO SCORE</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">{selectedProduct.item_name}</h2>
                    <p className="text-sm text-white/50 mt-1">{selectedProduct.item_description || 'No description'}</p>
                  </div>

                  {/* Selected Materials */}
                  <div>
                    <h4 className="text-xs font-semibold mb-3 flex items-center gap-2 text-white/70">
                      <Layers className="w-4 h-4 text-[#4dd6a8]" />
                      SELECTED MATERIALS
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg border border-white/5">
                        <div>
                          <p className="text-[10px] text-white/40 tracking-widest">UPHOLSTERY</p>
                          <p className="text-sm font-medium">Premium Fabric</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-white/20" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0f1419] rounded-lg border border-white/5">
                        <div>
                          <p className="text-[10px] text-white/40 tracking-widest">STRUCTURE</p>
                          <p className="text-sm font-medium">Solid Oak</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-2 border-white/20" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-white/10">
                    <span className="text-xs text-white/50">CATEGORY</span>
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {selectedProduct.item_category}
                    </Badge>
                  </div>

                  {selectedProduct.item_price && (
                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                      <span className="text-xs text-white/50">EST. MANUFACTURING</span>
                      <span className="text-xl font-bold text-[#4dd6a8]">
                        ₹{selectedProduct.item_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      onClick={() => setBomItem(selectedProduct)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      VIEW BOM ANALYSIS
                    </Button>
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      onClick={() => setEditingImageItem(selectedProduct)}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      EDIT IMAGE
                    </Button>
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      onClick={() => setSharingItem(selectedProduct)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      SHARE PRODUCT
                    </Button>
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      onClick={() => setVendorRequestItem(selectedProduct)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      VENDOR REQUEST
                    </Button>
                    <Button 
                      variant="ghost"
                      className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => { setItemToDelete(selectedProduct); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      DELETE
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {getCurrentItems().map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-[#1a2027] rounded-xl overflow-hidden border border-white/5 hover:border-[#4dd6a8]/50 transition-all cursor-pointer"
                    onClick={() => setSelectedProduct(item)}
                  >
                    <div className="aspect-square bg-[#0f1419] p-4">
                      <img
                        src={item.item_image_url || '/placeholder.svg'}
                        alt={item.item_name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium truncate flex-1">{item.item_name}</h3>
                        {item.is_public && <Globe className="w-3 h-3 text-[#4dd6a8]" />}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-white/50">{item.item_category}</p>
                        {item.item_price && (
                          <p className="text-xs font-semibold text-[#4dd6a8]">
                            ₹{item.item_price.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a2027] border-white/10 text-white">
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); setSelectedProduct(item); }}
                            className="hover:bg-white/10 focus:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); setEditingImageItem(item); }}
                            className="hover:bg-white/10 focus:bg-white/10"
                          >
                            <Wand2 className="w-4 h-4 mr-2" /> Edit Image
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); setBomItem(item); }}
                            className="hover:bg-white/10 focus:bg-white/10"
                          >
                            <FileText className="w-4 h-4 mr-2" /> BOM
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); setSharingItem(item); }}
                            className="hover:bg-white/10 focus:bg-white/10"
                          >
                            <Share2 className="w-4 h-4 mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setDeleteDialogOpen(true); }}
                            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Product Strip (when item selected) */}
          {selectedProduct && isFurnitureItem(selectedProduct) && getCurrentItems().length > 1 && (
            <div className="h-28 border-t border-white/10 bg-[#0f1419] px-4 py-3">
              <ScrollArea className="w-full">
                <div className="flex gap-3">
                  {getCurrentItems().map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className={cn(
                        "w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all bg-[#1a2027] border-2",
                        selectedProduct.id === item.id
                          ? "border-[#4dd6a8] shadow-lg shadow-[#4dd6a8]/30"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img 
                        src={item.item_image_url || '/placeholder.svg'} 
                        alt={item.item_name}
                        className="w-full h-full object-contain p-2" 
                      />
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Create Bar */}
      <div className="border-t border-white/10 px-6 py-4 bg-[#1a2027]/50">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <div className="flex-1 flex items-center gap-3 bg-[#0f1419] rounded-full px-5 py-3 border border-white/10 focus-within:border-[#4dd6a8]/50 transition-colors">
            <Sparkles className="w-5 h-5 text-[#4dd6a8]" />
            <input
              value={createPrompt}
              onChange={(e) => setCreatePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Describe the custom piece you want to create (e.g., 'Biophilic lounge chair with organic curves...')"
              className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-sm"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/50 hover:text-white hover:bg-transparent"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            className="bg-[#4dd6a8] hover:bg-[#3ec99b] text-[#0f1419] font-semibold px-6 rounded-full shadow-lg shadow-[#4dd6a8]/30"
            onClick={handleCreate}
          >
            GENERATE
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-white/40">
          <span className="tracking-widest">SUGGESTIONS:</span>
          {stylesSuggestions.map(style => (
            <button 
              key={style} 
              onClick={() => handleStyleSuggestion(style)}
              className="hover:text-[#4dd6a8] transition-colors tracking-wide"
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a2027] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom furniture?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently delete "{itemToDelete?.item_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              if (selectedProduct && isFurnitureItem(selectedProduct) && selectedProduct.id === editingImageItem.id) {
                setSelectedProduct({ ...selectedProduct, item_image_url: newImageUrl });
              }
              toast({ title: 'Image updated!' });
            } catch (error) {
              console.error('Failed to update image:', error);
              toast({ variant: 'destructive', title: 'Error', description: 'Failed to save image.' });
            }
          }}
        />
      )}

      {/* Share Product Modal */}
      <ShareProductModal
        open={!!sharingItem}
        onOpenChange={(open) => !open && setSharingItem(null)}
        product={sharingItem}
        onShareCreated={() => fetchCustomFurniture()}
      />

      {/* Custom Material Uploader */}
      <CustomMaterialUploader
        open={materialUploaderOpen}
        onOpenChange={setMaterialUploaderOpen}
        onSuccess={fetchCustomFurniture}
      />
    </div>
  );
}
