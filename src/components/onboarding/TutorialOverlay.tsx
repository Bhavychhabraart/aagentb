import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialTooltip } from './TutorialTooltip';
import { workspaceTutorialSteps } from './tutorialSteps';

interface TutorialOverlayProps {
  isVisible: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TutorialOverlay({
  isVisible,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  
  const totalSteps = workspaceTutorialSteps.length;
  const step = workspaceTutorialSteps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  // Find and measure target element
  const updateTargetRect = useCallback(() => {
    if (!step) return;
    
    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = step.spotlightPadding || 8;
      
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position based on step.position
      const tooltipWidth = 320;
      const tooltipHeight = 200; // Approximate
      const gap = 16;
      
      let tooltipTop = 0;
      let tooltipLeft = 0;
      
      switch (step.position) {
        case 'bottom':
          tooltipTop = rect.bottom + gap + padding;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'top':
          tooltipTop = rect.top - tooltipHeight - gap - padding;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.left - tooltipWidth - gap - padding;
          break;
        case 'right':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
          tooltipLeft = rect.right + gap + padding;
          break;
      }
      
      // Keep tooltip within viewport
      tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
      tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));
      
      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
    } else {
      // Element not found, try again shortly
      setTargetRect(null);
    }
  }, [step]);

  // Update rect on step change and window resize
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(updateTargetRect, 100);
      
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);
      
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [isVisible, currentStep, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onSkip();
          break;
        case 'Enter':
        case 'ArrowRight':
          if (isLastStep) {
            onComplete();
          } else {
            onNext();
          }
          break;
        case 'ArrowLeft':
          if (currentStep > 0) {
            onPrev();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStep, isLastStep, onNext, onPrev, onSkip, onComplete]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  }, [isLastStep, onNext, onComplete]);

  if (!isVisible || !step) return null;

  // Create SVG mask for spotlight effect
  const spotlightMask = targetRect ? (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={targetRect.left}
            y={targetRect.top}
            width={targetRect.width}
            height={targetRect.height}
            rx="12"
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.75)"
        mask="url(#spotlight-mask)"
      />
    </svg>
  ) : (
    <div className="absolute inset-0 bg-black/75" />
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] pointer-events-auto"
        onClick={(e) => {
          // Only skip if clicking on the overlay itself, not the tooltip
          if (e.target === e.currentTarget) {
            // Optional: allow clicking through to next step
          }
        }}
      >
        {/* Spotlight overlay */}
        {spotlightMask}

        {/* Spotlight border/glow effect */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          >
            <div className="absolute inset-0 rounded-xl border-2 border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]" />
            <div className="absolute inset-0 rounded-xl animate-pulse border border-primary/30" />
          </motion.div>
        )}

        {/* Tooltip */}
        <div
          className="absolute pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <TutorialTooltip
            title={step.title}
            description={step.description}
            icon={step.icon}
            currentStep={currentStep}
            totalSteps={totalSteps}
            position={step.position}
            onNext={handleNext}
            onPrev={onPrev}
            onSkip={onSkip}
            canGoBack={currentStep > 0}
            isLastStep={isLastStep}
          />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
