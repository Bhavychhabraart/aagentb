import { Package, Camera, ShoppingCart, BarChart3, Plus, ArrowLeft, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type VendorSection = 'products' | 'studio' | 'orders' | 'analytics';

interface VendorSidebarProps {
  activeSection: VendorSection;
  onSectionChange: (section: VendorSection) => void;
  onAddProduct: () => void;
}

const navItems = [
  { id: 'products' as VendorSection, title: 'Products', icon: Package },
  { id: 'studio' as VendorSection, title: 'Photo Studio', icon: Camera },
  { id: 'orders' as VendorSection, title: 'Orders', icon: ShoppingCart },
  { id: 'analytics' as VendorSection, title: 'Analytics', icon: BarChart3 },
];

export function VendorSidebar({ activeSection, onSectionChange, onAddProduct }: VendorSidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'VN';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground truncate">Vendor Portal</span>
              <span className="text-xs text-muted-foreground truncate">Manage your products</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <Separator className="mx-4 w-auto" />

      <SidebarContent className="px-2 py-4">
        {/* Quick Action */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              onClick={onAddProduct}
              className="w-full gap-2 justify-start"
              size={isCollapsed ? 'icon' : 'default'}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Add Product</span>}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    tooltip={item.title}
                    className="gap-3"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/')}
                  tooltip="Back to App"
                  className="gap-3"
                >
                  <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>Back to App</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">{user?.email}</span>
              <span className="text-xs text-muted-foreground">Vendor</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="flex-shrink-0 h-8 w-8"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
