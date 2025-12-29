import { motion } from "framer-motion";
import { Grid3X3, Image, Palette, Package, Lightbulb, Layers, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedItem {
  file?: File;
  preview: string;
  name: string;
}

interface InputCardsProps {
  layout?: UploadedItem;
  roomPhoto?: UploadedItem;
  ceilingPlan?: UploadedItem;
  wallCeilingPlan?: UploadedItem;
  styleRefs: UploadedItem[];
  products: Array<{ name: string; imageUrl?: string }>;
  onCardClick: (id: "layout" | "room" | "style" | "products" | "rcp" | "wall-plan") => void;
  onClear: (id: "layout" | "room" | "style" | "products" | "rcp" | "wall-plan") => void;
}

export function InputCards({
  layout,
  roomPhoto,
  ceilingPlan,
  wallCeilingPlan,
  styleRefs,
  products,
  onCardClick,
  onClear,
}: InputCardsProps) {
  // Primary inputs - floating glass cards
  const primaryInputs = [
    {
      id: "layout" as const,
      icon: Grid3X3,
      title: "2D Layout",
      description: "Upload floor plan",
      hasContent: !!layout,
      preview: layout?.preview,
    },
    {
      id: "room" as const,
      icon: Image,
      title: "Room Photo",
      description: "Upload room image",
      hasContent: !!roomPhoto,
      preview: roomPhoto?.preview,
    },
  ];

  // Secondary inputs - compact floating pills
  const secondaryInputs = [
    {
      id: "style" as const,
      icon: Palette,
      label: "Style Reference",
      hasContent: styleRefs.length > 0,
      count: styleRefs.length,
    },
    {
      id: "rcp" as const,
      icon: Lightbulb,
      label: "Ceiling Plan",
      hasContent: !!ceilingPlan,
    },
    {
      id: "wall-plan" as const,
      icon: Layers,
      label: "Wall Plan",
      hasContent: !!wallCeilingPlan,
    },
    {
      id: "products" as const,
      icon: Package,
      label: "Products",
      hasContent: products.length > 0,
      count: products.length,
    },
  ];

  return (
    <div className="w-full max-w-5xl space-y-10 mb-10 mt-4">
      {/* Primary Inputs - Floating Glass Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-2 gap-8"
      >
        {primaryInputs.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCardClick(card.id)}
            className="relative group"
          >
            {/* Glass card */}
            <div className={cn(
              "relative flex items-center gap-5 p-6 rounded-2xl",
              "bg-[hsl(220,25%,8%/0.6)] backdrop-blur-xl",
              "border border-[hsl(200,50%,30%/0.2)]",
              "transition-all duration-300",
              "hover:border-cyan-500/30 hover:bg-[hsl(220,25%,10%/0.7)]",
              "hover:shadow-[0_0_40px_hsl(200,100%,50%/0.1),inset_0_1px_0_hsl(200,100%,80%/0.05)]",
              card.hasContent && "border-cyan-500/30 bg-[hsl(220,25%,10%/0.7)]"
            )}>
              {/* Preview image background */}
              {card.preview && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <img src={card.preview} alt="" className="w-full h-full object-cover opacity-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,25%,8%)] via-[hsl(220,25%,8%/0.95)] to-[hsl(220,25%,8%/0.8)]" />
                </div>
              )}
              
              {/* Clear button */}
              {card.hasContent && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(card.id); }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 border border-border/50 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:border-destructive hover:text-destructive-foreground z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
              {/* Icon container */}
              <div className={cn(
                "relative p-4 rounded-xl transition-all duration-300 shrink-0",
                card.hasContent 
                  ? "bg-cyan-500/15 shadow-[0_0_20px_hsl(185,100%,50%/0.15)]" 
                  : "bg-[hsl(220,25%,15%/0.5)] group-hover:bg-cyan-500/10"
              )}>
                <card.icon className={cn(
                  "w-7 h-7 transition-colors",
                  card.hasContent ? "text-cyan-400" : "text-muted-foreground group-hover:text-cyan-400"
                )} />
              </div>
              
              {/* Text */}
              <div className="relative text-left">
                <span className="block text-base font-medium text-foreground">{card.title}</span>
                <span className={cn(
                  "block text-sm transition-colors",
                  card.hasContent ? "text-cyan-400/80" : "text-muted-foreground/60"
                )}>
                  {card.hasContent ? "Uploaded ✓" : card.description}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Secondary Inputs - Floating Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {secondaryInputs.map((pill, index) => (
          <motion.button
            key={pill.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCardClick(pill.id)}
            className={cn(
              "group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full",
              "bg-[hsl(220,25%,8%/0.5)] backdrop-blur-lg",
              "border transition-all duration-200",
              pill.hasContent 
                ? "border-cyan-500/30 shadow-[0_0_15px_hsl(185,100%,50%/0.1)]" 
                : "border-[hsl(220,25%,20%/0.3)] hover:border-cyan-500/20"
            )}
          >
            <pill.icon className={cn(
              "w-4 h-4 transition-colors",
              pill.hasContent ? "text-cyan-400" : "text-muted-foreground/60 group-hover:text-cyan-400/80"
            )} />
            
            <span className={cn(
              "text-sm font-medium transition-colors",
              pill.hasContent ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground/80"
            )}>
              {pill.label}
            </span>
            
            {pill.hasContent ? (
              <span className="flex items-center gap-1.5">
                <span className="text-sm text-cyan-400">{pill.count || "✓"}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(pill.id); }}
                  className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ) : (
              <Plus className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-cyan-400/60" />
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
