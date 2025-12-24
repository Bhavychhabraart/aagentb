import { motion } from "framer-motion";

export function BackgroundEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient mesh */}
      <div className="absolute inset-0 bg-gradient-premium" />
      
      {/* Animated wave */}
      <div className="absolute bottom-0 left-0 right-0 h-[50%]">
        <svg
          viewBox="0 0 1440 600"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(217 100% 58% / 0.15)" />
              <stop offset="50%" stopColor="hsl(280 80% 55% / 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(217 100% 58% / 0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          {/* Primary wave */}
          <motion.path
            initial={{ d: "M0,150 C200,250 400,50 600,150 C800,250 1000,50 1200,150 C1400,250 1440,100 1440,150 L1440,600 L0,600 Z" }}
            animate={{ 
              d: [
                "M0,150 C200,250 400,50 600,150 C800,250 1000,50 1200,150 C1400,250 1440,100 1440,150 L1440,600 L0,600 Z",
                "M0,180 C200,80 400,180 600,100 C800,180 1000,80 1200,180 C1400,80 1440,150 1440,150 L1440,600 L0,600 Z",
                "M0,150 C200,250 400,50 600,150 C800,250 1000,50 1200,150 C1400,250 1440,100 1440,150 L1440,600 L0,600 Z",
              ]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave-gradient-1)"
          />
          
          {/* Secondary wave */}
          <motion.path
            initial={{ d: "M0,200 C150,100 350,200 500,150 C650,100 850,200 1000,150 C1150,100 1300,200 1440,150 L1440,600 L0,600 Z" }}
            animate={{ 
              d: [
                "M0,200 C150,100 350,200 500,150 C650,100 850,200 1000,150 C1150,100 1300,200 1440,150 L1440,600 L0,600 Z",
                "M0,150 C150,200 350,100 500,200 C650,150 850,100 1000,200 C1150,150 1300,100 1440,200 L1440,600 L0,600 Z",
                "M0,200 C150,100 350,200 500,150 C650,100 850,200 1000,150 C1150,100 1300,200 1440,150 L1440,600 L0,600 Z",
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            fill="url(#wave-gradient-2)"
          />
        </svg>
      </div>
      
      {/* Floating orbs */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" 
      />
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          scale: [1, 0.95, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[80px]" 
      />
      <motion.div 
        animate={{ 
          x: [0, 30, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[60px]" 
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
