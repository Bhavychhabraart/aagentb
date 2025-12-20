import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FolderOpen, Plus, Search, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  thumbnail_url: string | null;
  updated_at: string;
}

interface ProjectDropdownProps {
  currentProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onNewProject: () => void;
}

export function ProjectDropdown({ currentProjectId, onProjectSelect, onNewProject }: ProjectDropdownProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, thumbnail_url, updated_at')
      .order('updated_at', { ascending: false });

    if (!error) {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const currentProject = projects.find(p => p.id === currentProjectId);
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (projectId: string) => {
    onProjectSelect(projectId);
    setOpen(false);
    setSearch('');
  };

  const handleNewProject = () => {
    onNewProject();
    setOpen(false);
    setSearch('');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="gap-2 h-9 px-3 bg-secondary/50 border border-border hover:bg-secondary"
        >
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="max-w-[150px] truncate text-sm">
            {currentProject?.name || 'Select Project'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-popover border-border">
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-secondary border-border"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border" />

        {/* Projects List */}
        <ScrollArea className="max-h-[250px]">
          {loading ? (
            <div className="p-2 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 skeleton rounded" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {search ? 'No projects found' : 'No projects yet'}
            </div>
          ) : (
            <div className="p-1">
              {filteredProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={cn(
                    'flex items-center gap-3 p-2 cursor-pointer',
                    project.id === currentProjectId && 'bg-primary/10'
                  )}
                >
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {project.thumbnail_url ? (
                      <img 
                        src={project.thumbnail_url} 
                        alt={project.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {project.id === currentProjectId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator className="bg-border" />

        {/* Actions */}
        <div className="p-1">
          <DropdownMenuItem onClick={handleNewProject} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            New Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDashboard} className="gap-2 cursor-pointer">
            <FolderOpen className="h-4 w-4" />
            View Dashboard
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
