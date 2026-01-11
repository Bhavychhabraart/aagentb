import { motion } from 'framer-motion';
import { Check, Upload, Palette, Sparkles } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps?: number;
}

const steps = [
  { number: 1, title: 'Upload Layout', icon: Upload },
  { number: 2, title: 'Create Mood Board', icon: Palette },
  { number: 3, title: 'AI Render', icon: Sparkles },
];

export function WizardProgress({ currentStep, totalSteps = 3 }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const Icon = step.icon;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isActive 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-muted/50 border-muted-foreground/20 text-muted-foreground'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="activeStep"
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              <div className="hidden md:block">
                <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {step.title}
                </p>
              </div>
            </motion.div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="w-16 md:w-24 h-0.5 mx-4 bg-muted-foreground/20 relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
