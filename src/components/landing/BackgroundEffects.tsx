import { motion } from "framer-motion";

export function BackgroundEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      {/* Central spotlight vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, 
            hsl(217 100% 58% / 0.08) 0%, 
            hsl(280 80% 55% / 0.04) 30%,
            transparent 70%
          )`,
        }}
      />
      
      {/* Top spotlight */}
      <motion.div
        animate={{ 
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
        style={{
          background: `radial-gradient(ellipse at center top, 
            hsl(217 100% 60% / 0.12) 0%, 
            transparent 60%
          )`,
        }}
      />
      
      {/* Animated wave - more subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%]">
        <svg
          viewBox="0 0 1440 400"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-gradient-cinematic" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(217 100% 58% / 0.08)" />
              <stop offset="50%" stopColor="hsl(280 80% 55% / 0.04)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          
          <motion.path
            initial={{ d: "M0,100 C200,150 400,50 600,100 C800,150 1000,50 1200,100 C1400,150 1440,80 1440,100 L1440,400 L0,400 Z" }}
            animate={{ 
              d: [
                "M0,100 C200,150 400,50 600,100 C800,150 1000,50 1200,100 C1400,150 1440,80 1440,100 L1440,400 L0,400 Z",
                "M0,120 C200,70 400,120 600,80 C800,120 1000,70 1200,120 C1400,70 1440,100 1440,100 L1440,400 L0,400 Z",
                "M0,100 C200,150 400,50 600,100 C800,150 1000,50 1200,100 C1400,150 1440,80 1440,100 L1440,400 L0,400 Z",
              ]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#wave-gradient-cinematic)"
          />
        </svg>
      </div>
      
      {/* Floating orbs - more subtle and cinematic */}
      <motion.div 
        animate={{ 
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
          opacity: [0.04, 0.08, 0.04],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          y: [0, 25, 0],
          scale: [1, 0.95, 1],
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500 rounded-full blur-[100px]" 
      />
      
      {/* Subtle floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
          className="absolute w-1 h-1 bg-primary/50 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
        />
      ))}
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      
      {/* Bottom vignette */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[30%]"
        style={{
          background: 'linear-gradient(to top, hsl(220 25% 3%) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
