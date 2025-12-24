import { motion } from 'framer-motion';
import { Star, StarOff, Trash2, ExternalLink, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate } from '@/pages/AgentBBrain';
import { formatDistanceToNow } from 'date-fns';

interface LayoutTemplateCardProps {
  template: LayoutTemplate;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onUse: () => void;
}

export function LayoutTemplateCard({ template, onToggleFavorite, onDelete, onUse }: LayoutTemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="mb-3">
        {template.thumbnail_url ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={template.thumbnail_url}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-blue-500/10 flex items-center justify-center">
            <LayoutGrid className="h-12 w-12 text-blue-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium line-clamp-1">{template.name}</h4>
          <button
            onClick={onToggleFavorite}
            className="shrink-0 text-muted-foreground hover:text-amber-500 transition-colors"
          >
            {template.is_favorite ? (
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {template.room_type && (
          <Badge variant="secondary" className="text-[10px]">
            {template.room_type}
          </Badge>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              Used {template.use_count} times
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onUse}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Use
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}