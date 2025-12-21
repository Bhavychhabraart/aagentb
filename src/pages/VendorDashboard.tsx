import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, BarChart3, Plus, IndianRupee } from 'lucide-react';
import { AddProductModal } from '@/components/vendor/AddProductModal';
import { ProductCard } from '@/components/vendor/ProductCard';
import { VendorOrdersTable } from '@/components/vendor/VendorOrdersTable';
import { VendorAnalytics } from '@/components/vendor/VendorAnalytics';
import { PhotoStudio } from '@/components/vendor/PhotoStudio';
import { VendorSidebar } from '@/components/vendor/VendorSidebar';

interface VendorProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
}

type VendorSection = 'products' | 'studio' | 'orders' | 'analytics';

const sectionTitles: Record<VendorSection, { title: string; description: string }> = {
  products: { title: 'Products', description: 'Manage your product catalog' },
  studio: { title: 'Photo Studio', description: 'Create AI-powered product photos' },
  orders: { title: 'Orders', description: 'Track and manage customer orders' },
  analytics: { title: 'Analytics', description: 'View your sales performance' },
};

export default function VendorDashboard() {
  const { user, loading: authLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [activeSection, setActiveSection] = useState<VendorSection>('products');

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && userRole !== 'vendor') {
      navigate('/');
      return;
    }
    if (user && userRole === 'vendor') {
      fetchProducts();
      fetchStats();
    }
  }, [user, authLoading, userRole, navigate]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vendor_products')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get product count
    const { count: productCount } = await supabase
      .from('vendor_products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', user.id);

    const { count: activeCount } = await supabase
      .from('vendor_products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', user.id)
      .eq('is_active', true);

    // Get orders containing vendor's products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('item_price, order_id')
      .eq('vendor_id', user.id);

    const uniqueOrders = new Set(orderItems?.map(i => i.order_id) || []);
    const totalRevenue = orderItems?.reduce((sum, item) => sum + (item.item_price || 0), 0) || 0;

    setStats({
      totalProducts: productCount || 0,
      activeProducts: activeCount || 0,
      totalOrders: uniqueOrders.size,
      totalRevenue,
    });
  };

  const handleProductAdded = () => {
    fetchProducts();
    fetchStats();
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: VendorProduct) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('vendor_products')
      .delete()
      .eq('id', productId);

    if (!error) {
      fetchProducts();
      fetchStats();
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('vendor_products')
      .update({ is_active: isActive })
      .eq('id', productId);

    if (!error) {
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, is_active: isActive } : p))
      );
      fetchStats();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-gradient-brand mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const currentSection = sectionTitles[activeSection];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <VendorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onAddProduct={() => setShowAddModal(true)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold">{currentSection.title}</h1>
                <p className="text-sm text-muted-foreground">{currentSection.description}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Products</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {stats.totalProducts}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Products</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-500" />
                    {stats.activeProducts}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Orders</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    {stats.totalOrders}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Revenue</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-yellow-500" />
                    {stats.totalRevenue.toLocaleString('en-IN')}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Section Content */}
            {activeSection === 'products' && (
              <>
                {products.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No products yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first product to start selling in the marketplace.
                      </p>
                      <Button onClick={() => setShowAddModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Product
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={() => handleEditProduct(product)}
                        onDelete={() => handleDeleteProduct(product.id)}
                        onToggleActive={isActive => handleToggleActive(product.id, isActive)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === 'studio' && (
              <PhotoStudio products={products} vendorId={user?.id || ''} />
            )}

            {activeSection === 'orders' && <VendorOrdersTable />}

            {activeSection === 'analytics' && <VendorAnalytics stats={stats} />}
          </main>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        onSuccess={handleProductAdded}
        editingProduct={editingProduct}
      />
    </SidebarProvider>
  );
}
