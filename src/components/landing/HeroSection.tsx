import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-6 max-w-4xl mx-auto"
    >
      {/* Cinematic headline - compact */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2 leading-[0.95] tracking-tight"
      >
        STAGE AND SELL
      </motion.h1>
      
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-[0.95] tracking-tight"
      >
        <span className="text-gradient">BEAUTIFUL SPACES</span>
      </motion.h2>
      
      {/* Subtitle - single line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-sm text-muted-foreground tracking-widest uppercase"
      >
        Design · Visualize · Collaborate · Present
      </motion.p>
    </motion.div>
  );
}
