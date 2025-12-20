import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FolderOpen, 
  Image, 
  IndianRupee, 
  Zap, 
  Plus, 
  ArrowRight,
  Palette,
  FileDown,
  Search,
  ScanLine,
  LayoutGrid,
  TrendingUp,
  Package,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomFurnitureModal } from '@/components/creation/CustomFurnitureModal';

interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Render {
  id: string;
  render_url: string | null;
  prompt: string;
  created_at: string;
  project_id: string;
  project_name?: string;
}

interface Order {
  id: string;
  project_id: string;
  client_name: string;
  invoice_number: string | null;
  subtotal: number;
  commission: number;
  grand_total: number;
  status: string;
  created_at: string;
  project_name?: string;
}

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [renders, setRenders] = useState<Render[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomFurniture, setShowCustomFurniture] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      setProjects(projectsData || []);

      // Fetch renders with project names
      const { data: rendersData } = await supabase
        .from('renders')
        .select('id, render_url, prompt, created_at, project_id')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get project names for renders
      if (rendersData) {
        const projectIds = [...new Set(rendersData.map(r => r.project_id))];
        const { data: projectNames } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        const projectNameMap = new Map(projectNames?.map(p => [p.id, p.name]));
        setRenders(rendersData.map(r => ({ 
          ...r, 
          project_name: projectNameMap.get(r.project_id) || 'Unknown' 
        })));
      }

      // Fetch orders with project names
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersData) {
        const projectIds = [...new Set(ordersData.map(o => o.project_id))];
        const { data: projectNames } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        const projectNameMap = new Map(projectNames?.map(p => [p.id, p.name]));
        setOrders(ordersData.map(o => ({ 
          ...o, 
          project_name: projectNameMap.get(o.project_id) || 'Unknown' 
        })));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load dashboard.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: 'Untitled Project' })
      .select('id')
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
    } else {
      navigate(`/workspace?project=${data.id}`);
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/workspace?project=${projectId}`);
  };

  // Calculate stats
  const totalProjects = projects.length;
  const totalRenders = renders.length;
  const totalEarnings = orders.reduce((sum, o) => sum + (o.commission || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full bg-gradient-brand animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.email?.split('@')[0]}</p>
          </div>
          <Button onClick={handleNewProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-3xl font-bold text-foreground">{totalProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Renders</p>
                  <p className="text-3xl font-bold text-foreground">{totalRenders}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground">{formatINR(totalEarnings)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-3xl font-bold text-foreground">{pendingOrders}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FolderOpen className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="renders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Image className="h-4 w-4" />
              Renders
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <IndianRupee className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="h-4 w-4" />
              Quick Tools
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="pt-6">
                      <div className="aspect-video skeleton mb-4 rounded-lg" />
                      <div className="h-5 skeleton w-3/4 mb-2" />
                      <div className="h-4 skeleton w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : projects.length === 0 ? (
                <Card className="col-span-full bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
                    <Button onClick={handleNewProject}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                projects.map((project) => (
                  <Card 
                    key={project.id} 
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        {project.thumbnail_url ? (
                          <img 
                            src={project.thumbnail_url} 
                            alt={project.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-brand">
                            <LayoutGrid className="h-8 w-8 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-foreground truncate mb-1">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Renders Tab */}
          <TabsContent value="renders">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-video skeleton rounded-lg" />
                ))
              ) : renders.length === 0 ? (
                <Card className="col-span-full bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No renders yet</h3>
                    <p className="text-sm text-muted-foreground">Generate your first render from a project</p>
                  </CardContent>
                </Card>
              ) : (
                renders.map((render) => (
                  <div 
                    key={render.id} 
                    className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => navigate(`/workspace?project=${render.project_id}`)}
                  >
                    {render.render_url && (
                      <img 
                        src={render.render_url} 
                        alt="Render" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white truncate">{render.project_name}</p>
                        <p className="text-xs text-white/70">
                          {new Date(render.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Earnings Summary */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Earnings Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-medium">{orders.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Order Value</span>
                    <span className="font-medium">{formatINR(orders.reduce((s, o) => s + (o.subtotal || 0), 0))}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Commission (20%)</span>
                    <span className="font-medium text-success">{formatINR(totalEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Pending Orders</span>
                    <Badge variant="secondary">{pendingOrders}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Order History
                  </CardTitle>
                  <CardDescription>All orders with 20% commission tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {orders.length === 0 ? (
                      <div className="text-center py-8">
                        <IndianRupee className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div 
                            key={order.id} 
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{order.client_name}</span>
                                <Badge 
                                  variant={order.status === 'completed' ? 'default' : 'secondary'}
                                  className={cn(
                                    order.status === 'completed' && 'bg-success text-success-foreground',
                                    order.status === 'pending' && 'bg-warning/20 text-warning'
                                  )}
                                >
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {order.invoice_number} • {order.project_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Subtotal: {formatINR(order.subtotal)}</p>
                              <p className="font-medium text-success">+{formatINR(order.commission)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Tools Tab */}
          <TabsContent value="tools">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={handleNewProject}
              >
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">New Project</h3>
                  <p className="text-xs text-muted-foreground">Start a fresh design</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setShowCustomFurniture(true)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Palette className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Custom Furniture</h3>
                  <p className="text-xs text-muted-foreground">AI-generated designs</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => projects.length > 0 && handleOpenProject(projects[0].id)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <FileDown className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Export</h3>
                  <p className="text-xs text-muted-foreground">PPT & Invoice</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => projects.length > 0 && handleOpenProject(projects[0].id)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <ScanLine className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Detect Furniture</h3>
                  <p className="text-xs text-muted-foreground">Scan room images</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => projects.length > 0 && handleOpenProject(projects[0].id)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Image className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Style Transfer</h3>
                  <p className="text-xs text-muted-foreground">Apply design styles</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => projects.length > 0 && handleOpenProject(projects[0].id)}
              >
                <CardContent className="pt-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Browse Catalog</h3>
                  <p className="text-xs text-muted-foreground">Explore furniture</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Custom Furniture Modal */}
      <CustomFurnitureModal
        open={showCustomFurniture}
        onOpenChange={setShowCustomFurniture}
        projectId={projects.length > 0 ? projects[0].id : null}
        onFurnitureCreated={() => {
          toast({ title: 'Custom furniture created!' });
          setShowCustomFurniture(false);
        }}
      />
    </div>
  );
}
