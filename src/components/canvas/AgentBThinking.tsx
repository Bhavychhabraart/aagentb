import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AgentBThinkingProps {
  stage?: string;
  progress?: number;
}

const thinkingStages = [
  'Analyzing your layout...',
  'Understanding style preferences...',
  'Processing furniture selections...',
  'Detecting room dimensions...',
  'Preparing intelligent questions...',
];

export function AgentBThinking({ stage, progress = 0 }: AgentBThinkingProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through stages
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % thinkingStages.length);
    }, 2000);

    return () => clearInterval(stageInterval);
  }, []);

  // Animate dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  const displayStage = stage || thinkingStages[currentStage];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-fade-in">
      {/* Brain Container with Glow */}
      <div className="relative mb-6">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-brain-pulse" />
        
        {/* Main brain visualization */}
        <div className="relative w-24 h-24 rounded-full glass-premium flex items-center justify-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30 animate-gradient-shift" />
          
          {/* Brain SVG */}
          <svg
            viewBox="0 0 64 64"
            className="w-14 h-14 text-primary relative z-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {/* Brain outline */}
            <path
              d="M32 8c-8 0-14 4-16 10-4 2-6 8-4 14 0 4 2 8 6 10 2 6 8 10 14 10s12-4 14-10c4-2 6-6 6-10 2-6 0-12-4-14-2-6-8-10-16-10z"
              className="animate-neural-pulse"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Brain folds - left hemisphere */}
            <path
              d="M20 24c4-2 6 2 8 4s2 6-2 8"
              className="animate-neural-flow"
              strokeLinecap="round"
            />
            <path
              d="M18 32c2-2 6-2 8 2"
              className="animate-neural-flow"
              style={{ animationDelay: '0.2s' }}
              strokeLinecap="round"
            />
            {/* Brain folds - right hemisphere */}
            <path
              d="M44 24c-4-2-6 2-8 4s-2 6 2 8"
              className="animate-neural-flow"
              style={{ animationDelay: '0.4s' }}
              strokeLinecap="round"
            />
            <path
              d="M46 32c-2-2-6-2-8 2"
              className="animate-neural-flow"
              style={{ animationDelay: '0.6s' }}
              strokeLinecap="round"
            />
            {/* Central connection */}
            <path
              d="M32 16v28"
              className="animate-neural-pulse"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>

          {/* Orbiting dots */}
          <div className="absolute inset-0">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary animate-orbit"
                style={{
                  animationDelay: `${i * 0.5}s`,
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 90}deg) translateX(40px)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Sparkle effects */}
        <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-primary/60 animate-sparkle" />
        <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-accent/60 animate-sparkle" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Stage text */}
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground font-medium">
          {displayStage}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary animate-progress-shimmer"
          style={{
            width: `${progress > 0 ? progress : 30}%`,
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* Subtle hint */}
      <p className="text-xs text-muted-foreground/60 mt-4 font-mono">
        Agent B is thinking...
      </p>
    </div>
  );
}
