import { motion } from "framer-motion";

export function BackgroundEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep navy base */}
      <div className="absolute inset-0 bg-[hsl(220,30%,4%)]" />
      
      {/* Radial gradient overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 20%, 
            hsl(220 40% 8%) 0%, 
            transparent 70%
          )`,
        }}
      />

      {/* Central glowing orb */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-5%' }}>
        {/* Orb outer glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, 
              hsl(200 100% 50% / 0.15) 0%, 
              hsl(210 100% 45% / 0.08) 40%,
              transparent 70%
            )`,
            filter: 'blur(40px)',
          }}
        />
        
        {/* Orb middle ring */}
        <motion.div
          animate={{ 
            scale: [1, 1.03, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 30, repeat: Infinity, ease: "linear" }
          }}
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: `conic-gradient(from 0deg, 
              hsl(200 100% 60% / 0.2) 0deg,
              hsl(210 100% 55% / 0.05) 90deg,
              hsl(200 100% 60% / 0.2) 180deg,
              hsl(210 100% 55% / 0.05) 270deg,
              hsl(200 100% 60% / 0.2) 360deg
            )`,
            filter: 'blur(20px)',
          }}
        />
        
        {/* Orb core - the bright center */}
        <motion.div
          animate={{ 
            scale: [1, 1.08, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[180px] h-[180px] rounded-full"
          style={{
            background: `radial-gradient(circle, 
              hsl(195 100% 65% / 0.9) 0%, 
              hsl(200 100% 55% / 0.6) 30%,
              hsl(210 100% 50% / 0.3) 60%,
              transparent 80%
            )`,
            boxShadow: `
              0 0 60px hsl(200 100% 60% / 0.5),
              0 0 120px hsl(200 100% 55% / 0.3),
              0 0 200px hsl(210 100% 50% / 0.2)
            `,
          }}
        />
        
        {/* Inner bright spot */}
        <motion.div
          animate={{ 
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[60px] h-[60px] rounded-full"
          style={{
            background: `radial-gradient(circle, 
              hsl(190 100% 80%) 0%, 
              hsl(195 100% 70% / 0.5) 50%,
              transparent 100%
            )`,
          }}
        />
      </div>

      {/* Connection lines to cards - left */}
      <motion.div
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 0.3, pathLength: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute left-1/2 top-1/2 -translate-y-1/2"
      >
        <svg width="400" height="200" className="absolute -left-[400px] -top-[100px]" style={{ opacity: 0.15 }}>
          <defs>
            <linearGradient id="line-gradient-left" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="hsl(200 100% 60%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M400,100 Q300,100 200,80 T0,100"
            stroke="url(#line-gradient-left)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      {/* Connection lines to cards - right */}
      <motion.div
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: 0.3, pathLength: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute left-1/2 top-1/2 -translate-y-1/2"
      >
        <svg width="400" height="200" className="absolute -top-[100px]" style={{ opacity: 0.15 }}>
          <defs>
            <linearGradient id="line-gradient-right" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="hsl(200 100% 60%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,100 Q100,100 200,80 T400,100"
            stroke="url(#line-gradient-right)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      {/* Floating particles around orb */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 200 + Math.random() * 100;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.5;
        
        return (
          <motion.div
            key={i}
            animate={{
              y: [y - 10, y + 10, y - 10],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(45% + ${y}px)`,
              background: `radial-gradient(circle, hsl(200 100% 70%) 0%, transparent 70%)`,
              boxShadow: '0 0 10px hsl(200 100% 60% / 0.5)',
            }}
          />
        );
      })}

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(200 50% 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(200 50% 50%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Bottom vignette */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40%]"
        style={{
          background: 'linear-gradient(to top, hsl(220 30% 3%) 0%, transparent 100%)',
        }}
      />
      
      {/* Top vignette */}
      <div 
        className="absolute top-0 left-0 right-0 h-[20%]"
        style={{
          background: 'linear-gradient(to bottom, hsl(220 30% 3% / 0.5) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
