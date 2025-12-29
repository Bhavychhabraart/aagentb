import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-8 max-w-3xl mx-auto"
    >
      {/* Main headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-4 leading-[1.1] tracking-tight"
      >
        Your AI Agent for{" "}
        <span className="font-medium bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Stunning Interiors
        </span>
      </motion.h1>
      
      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-base md:text-lg text-muted-foreground/60 font-light max-w-xl mx-auto"
      >
        Stage, visualize, and sell beautiful spaces with AI-powered design intelligence
      </motion.p>
    </motion.div>
  );
}
