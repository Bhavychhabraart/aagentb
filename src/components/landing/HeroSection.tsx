import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-12 max-w-4xl mx-auto"
    >
      {/* Premium badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-primary/30 mb-8"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="text-sm font-medium text-primary tracking-wide">AI-Powered Design Studio</span>
      </motion.div>
      
      {/* Cinematic headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4 leading-[0.95] tracking-tight"
      >
        STAGE AND SELL
      </motion.h1>
      
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[0.95] tracking-tight"
      >
        <span className="text-gradient">BEAUTIFUL SPACES</span>
      </motion.h2>
      
      {/* Subtitle with refined typography */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed tracking-wide"
      >
        Design<span className="text-primary/60 mx-3">·</span>Visualize<span className="text-primary/60 mx-3">·</span>Collaborate<span className="text-primary/60 mx-3">·</span>Present
      </motion.p>
    </motion.div>
  );
}
