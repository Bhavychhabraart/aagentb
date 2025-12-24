import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Grid3X3, 
  Lightbulb, 
  Zap, 
  Droplets, 
  Sofa,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: "floor-plan",
    icon: Grid3X3,
    title: "Architectural Floor Plan",
    subtitle: "Base Layout",
    description: "Walls, partitions, room dimensions, doors, windows, circulation paths",
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
  },
  {
    id: "rcp",
    icon: Lightbulb,
    title: "RCP - Ceiling Plan",
    subtitle: "Reflected Ceiling",
    description: "False ceiling design, lights, AC diffusers, fans, ceiling heights",
    color: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400",
  },
  {
    id: "electrical",
    icon: Zap,
    title: "Electrical Plan",
    subtitle: "Power & Circuits",
    description: "Switchboards, light points, power sockets, AC points, distribution board",
    color: "from-yellow-500/20 to-yellow-600/5",
    iconColor: "text-yellow-400",
  },
  {
    id: "plumbing",
    icon: Droplets,
    title: "Plumbing & Sanitary",
    subtitle: "Water & Drainage",
    description: "Water supply lines, drainage pipes, floor traps, sanitary fixtures",
    color: "from-cyan-500/20 to-cyan-600/5",
    iconColor: "text-cyan-400",
  },
  {
    id: "furniture",
    icon: Sofa,
    title: "Furniture Layout",
    subtitle: "Interior Plan",
    description: "Furniture placement, wardrobes, clearances, movement paths",
    color: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-400",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

export function ToolsGrid() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl mb-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Architectural Drawing Tools
        </h2>
        <p className="text-muted-foreground">
          Upload a base layout and generate AI-powered professional plans
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/tools/${tool.id}`)}
            className={cn(
              "group relative flex flex-col items-start text-left",
              "p-5 rounded-2xl border border-border/50",
              "bg-gradient-to-br backdrop-blur-sm",
              tool.color,
              "hover:border-primary/40 hover:shadow-[0_0_30px_hsl(217_100%_58%/0.15)]",
              "transition-all duration-300"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "p-3 rounded-xl mb-4",
              "bg-background/50 border border-border/30",
              "group-hover:border-primary/30 transition-colors"
            )}>
              <tool.icon className={cn("w-6 h-6", tool.iconColor)} />
            </div>

            {/* Text */}
            <h3 className="font-semibold text-foreground text-sm mb-0.5">
              {tool.title}
            </h3>
            <span className="text-xs text-primary font-medium mb-2">
              {tool.subtitle}
            </span>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
              {tool.description}
            </p>

            {/* Arrow */}
            <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>Open tool</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
