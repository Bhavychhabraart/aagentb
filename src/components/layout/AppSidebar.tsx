import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FolderOpen, 
  LogOut, 
  User, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  LayoutDashboard, 
  Store, 
  Palette, 
  Grid3X3, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RoomListPanel } from './RoomListPanel';

interface Project {
  id: string;
  name: string;
  updated_at: string;
}

interface AppSidebarProps {
  currentProjectId: string | null;
  currentRoomId: string | null;
  onProjectSelect: (projectId: string) => void;
  onRoomSelect: (roomId: string) => void;
  onNewProject: () => void;
}

export function AppSidebar({ currentProjectId, currentRoomId, onProjectSelect, onRoomSelect, onNewProject }: AppSidebarProps) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Auto-expand current project
  useEffect(() => {
    if (currentProjectId) {
      setExpandedProjects(prev => new Set([...prev, currentProjectId]));
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch projects:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load projects.',
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveProjectName = async () => {
    if (!editingId || !editingName.trim()) {
      cancelEditing();
      return;
    }

    const { error } = await supabase
      .from('projects')
      .update({ name: editingName.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rename project.',
      });
    } else {
      setProjects(prev => 
        prev.map(p => p.id === editingId ? { ...p, name: editingName.trim() } : p)
      );
      toast({ title: 'Project renamed' });
    }
    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveProjectName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const deleteProject = async () => {
    if (!projectToDelete) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete project.',
      });
    } else {
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      toast({ title: 'Project deleted' });
      
      // If deleted project was selected, select another one
      if (currentProjectId === projectToDelete.id) {
        const remaining = projects.filter(p => p.id !== projectToDelete.id);
        if (remaining.length > 0) {
          onProjectSelect(remaining[0].id);
        } else {
          onNewProject();
        }
      }
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const navItems = [
    {
      label: userRole === 'vendor' ? 'Vendor Dashboard' : 'Dashboard',
      icon: userRole === 'vendor' ? Store : LayoutDashboard,
      onClick: () => navigate(userRole === 'vendor' ? '/vendor' : '/dashboard'),
    },
    {
      label: 'Custom Library',
      icon: Palette,
      onClick: () => navigate('/custom-furniture'),
    },
    {
      label: 'Layout Creator',
      icon: Grid3X3,
      onClick: () => navigate('/layout-creator'),
    },
  ];

  return (
    <>
      <Sidebar 
        collapsible="icon" 
        className="sidebar-premium border-r border-border/30"
      >
        {/* Header */}
        <SidebarHeader className="p-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <div className="animate-fade-in overflow-hidden">
                <h1 className="text-base font-semibold text-foreground tracking-tight">Agent B</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Design Studio</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={item.onClick}
                        className="sidebar-nav-item"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="glass-premium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              
              {/* New Project Button */}
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={onNewProject}
                      className="sidebar-nav-item bg-primary/10 hover:bg-primary/20 text-primary"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span className="truncate">New Project</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="glass-premium">
                      New Project
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Collapse Toggle */}
          <div className={cn(
            "flex px-2 py-1",
            isCollapsed ? "justify-center" : "justify-end"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg transition-all duration-200"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator className="my-2 bg-border/30" />

          {/* Projects Section - Hidden when collapsed */}
          {!isCollapsed && (
            <SidebarGroup className="animate-fade-in">
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 px-2">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <ScrollArea className="h-[calc(100vh-400px)] px-1">
                  {loading ? (
                    <div className="space-y-2 p-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="p-4 text-center">
                      <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">No projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {projects.map((project) => (
                        <Collapsible
                          key={project.id}
                          open={expandedProjects.has(project.id)}
                          onOpenChange={() => toggleProjectExpanded(project.id)}
                        >
                          <div
                            className={cn(
                              'group flex items-center gap-1 rounded-lg transition-all duration-200',
                              currentProjectId === project.id
                                ? 'bg-primary/15 border-l-2 border-primary'
                                : 'hover:bg-muted/50'
                            )}
                          >
                            {editingId === project.id ? (
                              <div className="flex-1 flex items-center gap-1 p-1">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  onBlur={saveProjectName}
                                  autoFocus
                                  className="h-8 text-sm bg-background/50 border-primary/30"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-emerald-500"
                                  onClick={saveProjectName}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <CollapsibleTrigger asChild>
                                  <button className="p-1.5 hover:bg-muted/50 rounded-md transition-colors">
                                    {expandedProjects.has(project.id) ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                </CollapsibleTrigger>
                                <button
                                  onClick={() => onProjectSelect(project.id)}
                                  className={cn(
                                    'flex-1 text-left py-2 text-sm transition-colors',
                                    currentProjectId === project.id
                                      ? 'text-primary font-medium'
                                      : 'text-foreground/80 hover:text-foreground'
                                  )}
                                >
                                  <span className="block truncate">{project.name}</span>
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        'h-7 w-7 shrink-0 mr-1',
                                        'opacity-0 group-hover:opacity-100 transition-opacity',
                                        currentProjectId === project.id && 'opacity-100'
                                      )}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 glass-premium">
                                    <DropdownMenuItem onClick={() => startEditing(project)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/30" />
                                    <DropdownMenuItem 
                                      onClick={() => confirmDelete(project)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                          
                          {/* Rooms under project */}
                          <CollapsibleContent className="pl-4">
                            <RoomListPanel
                              projectId={project.id}
                              currentRoomId={currentProjectId === project.id ? currentRoomId : null}
                              onRoomSelect={(roomId) => {
                                if (currentProjectId !== project.id) {
                                  onProjectSelect(project.id);
                                }
                                onRoomSelect(roomId);
                              }}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Collapsed state: Show folder icon */}
          {isCollapsed && (
            <div className="flex justify-center py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={toggleSidebar}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass-premium">
                  {projects.length} Projects
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 border-t border-border/20">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-200",
            isCollapsed ? "justify-center" : "px-2 py-1.5"
          )}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass-premium">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-premium border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{projectToDelete?.name}" and all its data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/30">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
