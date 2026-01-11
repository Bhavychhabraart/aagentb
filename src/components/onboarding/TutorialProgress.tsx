import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function TutorialProgress({ currentStep, totalSteps }: TutorialProgressProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">
        {currentStep + 1} of {totalSteps}
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: index === currentStep ? 1.2 : 1,
              opacity: index === currentStep ? 1 : index < currentStep ? 0.7 : 0.3,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              'rounded-full transition-colors duration-200',
              index === currentStep
                ? 'w-2.5 h-2.5 bg-primary'
                : index < currentStep
                ? 'w-2 h-2 bg-primary/50'
                : 'w-2 h-2 bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  );
}
