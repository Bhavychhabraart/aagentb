import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TutorialProgress } from './TutorialProgress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TutorialTooltipProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  currentStep: number;
  totalSteps: number;
  position: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export function TutorialTooltip({
  title,
  description,
  icon: Icon,
  currentStep,
  totalSteps,
  position,
  onNext,
  onPrev,
  onSkip,
  canGoBack,
  isLastStep,
}: TutorialTooltipProps) {
  // Arrow positioning based on tooltip position
  const arrowClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white/10',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white/10',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white/10',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -10 : position === 'top' ? 10 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative w-[320px] p-5 rounded-2xl',
        'bg-gradient-to-br from-background/95 to-background/90',
        'backdrop-blur-xl border border-white/10',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      )}
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-0 h-0 border-[6px]',
          arrowStyles[position]
        )}
      />

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Skip tutorial"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header with icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Progress and navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <TutorialProgress currentStep={currentStep} totalSteps={totalSteps} />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={!canGoBack}
            className="h-8 px-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={onNext}
            className={cn(
              'h-8 px-4 font-medium',
              isLastStep
                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
