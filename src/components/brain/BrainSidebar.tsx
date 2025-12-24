import { motion } from 'framer-motion';
import { 
  LayoutGrid, Palette, FileText, Image, BookOpen, 
  BarChart2, Plus, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { KnowledgeType } from '@/pages/AgentBBrain';

interface BrainSidebarProps {
  activeSection: 'overview' | KnowledgeType | 'all';
  onSectionChange: (section: 'overview' | KnowledgeType | 'all') => void;
  stats: {
    layouts: number;
    styles: number;
    rules: number;
    designs: number;
    total: number;
  };
  onAddKnowledge: (type: KnowledgeType) => void;
}

const sections: Array<{ id: string; label: string; icon: typeof BarChart2; statKey?: keyof BrainSidebarProps['stats'] }> = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'layout', label: 'Layouts', icon: LayoutGrid, statKey: 'layouts' },
  { id: 'style', label: 'Styles', icon: Palette, statKey: 'styles' },
  { id: 'rule', label: 'Rules', icon: FileText, statKey: 'rules' },
  { id: 'design', label: 'Designs', icon: Image, statKey: 'designs' },
  { id: 'all', label: 'All Knowledge', icon: BookOpen, statKey: 'total' },
];

export function BrainSidebar({ activeSection, onSectionChange, stats, onAddKnowledge }: BrainSidebarProps) {
  return (
    <div className="w-56 border-r border-border bg-card/50 flex flex-col">
      {/* Quick Add */}
      <div className="p-3 border-b border-border">
        <Button
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          onClick={() => onAddKnowledge('layout')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Knowledge
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const count = section.statKey ? stats[section.statKey as keyof typeof stats] : undefined;
          
          return (
            <motion.button
              key={section.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSectionChange(section.id as typeof activeSection)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <section.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
              <span className="flex-1 text-left">{section.label}</span>
              {count !== undefined && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-2">
              <Brain className="h-3 w-3" />
              Memory Usage
            </span>
            <span className="font-medium text-foreground">
              {Math.min(100, Math.round((stats.total / 50) * 100))}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (stats.total / 50) * 100)}%` }}
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
            />
          </div>
          <p className="text-muted-foreground">
            {stats.total} items stored
          </p>
        </div>
      </div>
    </div>
  );
}