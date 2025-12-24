import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FormSectionProps {
  icon?: LucideIcon;
  title: string;
  badge?: string | number;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  icon: Icon,
  title,
  badge,
  defaultOpen = true,
  collapsible = true,
  children,
  className,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-premium rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Section Header */}
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        disabled={!collapsible}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "text-left transition-colors",
          collapsible && "hover:bg-muted/30 cursor-pointer",
          !collapsible && "cursor-default"
        )}
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground/90">{title}</span>
          {badge !== undefined && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0"
            >
              {badge}
            </Badge>
          )}
        </div>
        
        {collapsible && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-4 pb-4 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
