import { motion } from 'framer-motion';
import { Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StyleCollection } from '@/pages/AgentBBrain';
import { formatDistanceToNow } from 'date-fns';

interface StyleCollectionCardProps {
  style: StyleCollection;
  onDelete: () => void;
}

export function StyleCollectionCard({ style, onDelete }: StyleCollectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
    >
      {/* Color Preview */}
      <div className="mb-3">
        {style.colors && style.colors.length > 0 ? (
          <div className="aspect-video rounded-lg overflow-hidden flex">
            {style.colors.map((color, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Palette className="h-12 w-12 text-pink-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium line-clamp-1">{style.name}</h4>
          {style.is_active && (
            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          )}
        </div>
        
        {style.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {style.description}
          </p>
        )}

        {style.furniture_styles && style.furniture_styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {style.furniture_styles.slice(0, 3).map(s => (
              <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {style.colors?.length || 0} colors
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
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