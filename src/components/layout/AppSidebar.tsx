import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground">Agent B</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Design Workspace</p>
      </div>

      {/* New Project Button */}
      <div className="p-3">
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
                <button
                  key={project.id}
                  onClick={() => onProjectSelect(project.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    currentProjectId === project.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground'
                  )}
                >
                  <span className="block truncate">{project.name}</span>
                </button>
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
  );
}