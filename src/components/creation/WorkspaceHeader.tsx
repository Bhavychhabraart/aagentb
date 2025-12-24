import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  title: string;
  subtitle: string;
  isEditing?: boolean;
  isSaving?: boolean;
  canSave?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function WorkspaceHeader({
  title,
  subtitle,
  isEditing = false,
  isSaving = false,
  canSave = false,
  onBack,
  onCancel,
  onSave,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-xl hover:bg-muted/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
        
        <div className="flex items-center gap-4">
          {/* Icon with gradient background */}
          <motion.div 
            className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
          </motion.div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <motion.h1 
                className="text-xl font-semibold tracking-tight"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {title}
              </motion.h1>
              
              {/* AI Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                  "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30"
                )}
              >
                AI-Powered
              </motion.div>
            </div>
            
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {subtitle}
            </motion.p>
          </div>
        </div>
      </div>
      
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="rounded-xl border-border/50 hover:bg-muted/50"
        >
          Cancel
        </Button>
        
        <Button 
          onClick={onSave} 
          disabled={isSaving || !canSave}
          className={cn(
            "gap-2 rounded-xl min-w-[140px]",
            canSave && "btn-glow"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditing ? 'Update' : 'Save to Library'}
            </>
          )}
        </Button>
      </motion.div>
    </header>
  );
}
