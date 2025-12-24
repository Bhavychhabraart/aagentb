import { motion } from 'framer-motion';
import { Trash2, FileText, Image, Palette, LayoutGrid, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KnowledgeItem, KnowledgeType } from '@/pages/AgentBBrain';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeGridProps {
  items: KnowledgeItem[];
  onDelete: (id: string) => void;
}

const typeConfig: Record<KnowledgeType, { icon: typeof FileText; color: string; bgColor: string }> = {
  layout: { icon: LayoutGrid, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  style: { icon: Palette, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  rule: { icon: FileText, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  design: { icon: Image, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  preference: { icon: FileText, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
};

export function KnowledgeGrid({ items, onDelete }: KnowledgeGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => {
        const config = typeConfig[item.knowledge_type];
        const Icon = config.icon;
        
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
          >
            {/* Thumbnail or Icon */}
            <div className="mb-3">
              {item.thumbnail_url || item.file_url ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={item.thumbnail_url || item.file_url || ''}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={cn('aspect-video rounded-lg flex items-center justify-center', config.bgColor)}>
                  <Icon className={cn('h-12 w-12', config.color)} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium line-clamp-1">{item.title}</h4>
                <Badge variant="secondary" className={cn('shrink-0 text-[10px]', config.bgColor, config.color)}>
                  {item.knowledge_type}
                </Badge>
              </div>
              
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active indicator */}
            {item.is_active && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-500 ring-2 ring-green-500/20" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}