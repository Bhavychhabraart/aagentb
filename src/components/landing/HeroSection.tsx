import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-16 max-w-3xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="text-sm font-medium text-primary">AI-Powered Design</span>
      </motion.div>
      
      <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
        Stage and Sell
        <br />
        <span className="text-gradient">Beautiful Spaces</span>
      </h2>
      
      <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
        Design, visualize, collaborate and present — all in one intelligent platform.
      </p>
    </motion.div>
  );
}
