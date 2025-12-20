import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, LogOut, User, MoreHorizontal, Pencil, Trash2, Check, X, LayoutDashboard } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  updated_at: string;
}

interface AppSidebarProps {
  currentProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onNewProject: () => void;
}

export function AppSidebar({ currentProjectId, onProjectSelect, onNewProject }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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

  return (
    <>
      <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-semibold text-sidebar-foreground">Agent B</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Design Workspace</p>
        </div>

        {/* Dashboard Link */}
        <div className="p-3 space-y-2">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full justify-start gap-2"
            variant="ghost"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            onClick={onNewProject}
            className="w-full justify-start gap-2"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Projects List */}
        <div className="flex-1 overflow-hidden">
          <div className="px-3 py-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Projects
            </h2>
          </div>
          <ScrollArea className="flex-1 px-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 skeleton" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-center">
                <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      'group flex items-center gap-1 rounded-md transition-colors',
                      currentProjectId === project.id
                        ? 'bg-sidebar-accent'
                        : 'hover:bg-sidebar-accent/50'
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
                          className="h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={saveProjectName}
                        >
                          <Check className="h-3.5 w-3.5 text-success" />
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
                        <button
                          onClick={() => onProjectSelect(project.id)}
                          className={cn(
                            'flex-1 text-left px-3 py-2 text-sm transition-colors',
                            currentProjectId === project.id
                              ? 'text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground'
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
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => startEditing(project)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{projectToDelete?.name}" and all its data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
