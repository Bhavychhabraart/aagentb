import { motion } from 'framer-motion';
import { Sparkles, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreationModeToggleProps {
  mode: 'scratch' | 'catalog';
  onModeChange: (mode: 'scratch' | 'catalog') => void;
}

export function CreationModeToggle({ mode, onModeChange }: CreationModeToggleProps) {
  const options = [
    {
      value: 'scratch' as const,
      icon: Sparkles,
      title: 'From Scratch',
      description: 'Describe your ideal piece',
    },
    {
      value: 'catalog' as const,
      icon: Package,
      title: 'From Catalog',
      description: 'Pick & customize existing',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isActive = mode === option.value;
        const Icon = option.icon;

        return (
          <motion.button
            key={option.value}
            onClick={() => onModeChange(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300",
              isActive
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Icon container */}
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-primary/15 shadow-[0_0_20px_hsl(var(--primary)/0.2)]" 
                : "bg-muted/50"
            )}>
              <Icon className={cn(
                "h-5 w-5 transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>

            {/* Text content */}
            <div className="text-center space-y-0.5">
              <p className={cn(
                "text-sm font-medium transition-colors duration-300",
                isActive ? "text-foreground" : "text-foreground/80"
              )}>
                {option.title}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {option.description}
              </p>
            </div>

            {/* Glow effect for active state */}
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-primary/5 -z-10" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
