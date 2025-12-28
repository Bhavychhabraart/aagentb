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
  // Primary inputs - large cards with animated gradient borders
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

  // Secondary inputs - compact pills
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
      label: "Ceiling Plan (RCP)",
      hasContent: !!ceilingPlan,
    },
    {
      id: "wall-plan" as const,
      icon: Layers,
      label: "Wall Ceiling Plan",
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
    <div className="w-full max-w-4xl space-y-5 mb-5">
      {/* Primary Inputs - Larger Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-2 gap-5"
      >
        {primaryInputs.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCardClick(card.id)}
            className="relative group"
          >
            {/* Animated gradient border */}
            <div className={cn(
              "absolute -inset-[1px] rounded-2xl opacity-50 transition-opacity duration-300",
              "bg-gradient-to-r from-primary via-violet-500 to-primary bg-[length:200%_100%]",
              "group-hover:opacity-100",
              card.hasContent && "opacity-70"
            )} style={{ animation: 'gradient-x 3s ease infinite' }} />
            
            {/* Card content */}
            <div className={cn(
              "relative flex items-center gap-5 p-6 rounded-2xl",
              "bg-background/95 backdrop-blur-sm",
              "transition-all duration-300"
            )}>
              {/* Preview image background */}
              {card.preview && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <img src={card.preview} alt="" className="w-full h-full object-cover opacity-15" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
                </div>
              )}
              
              {/* Clear button */}
              {card.hasContent && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(card.id); }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:border-destructive hover:text-destructive-foreground z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
              {/* Icon */}
              <div className={cn(
                "relative p-4 rounded-xl transition-all duration-300 shrink-0",
                card.hasContent ? "bg-primary/20" : "bg-muted/40 group-hover:bg-primary/10"
              )}>
                <card.icon className={cn(
                  "w-8 h-8 transition-colors",
                  card.hasContent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
              </div>
              
              {/* Text */}
              <div className="relative text-left">
                <span className="block text-base font-semibold text-foreground">{card.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {card.hasContent ? "Uploaded ✓" : card.description}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Secondary Inputs - Larger Inline Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {secondaryInputs.map((pill, index) => (
          <motion.button
            key={pill.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCardClick(pill.id)}
            className={cn(
              "group relative flex items-center gap-2.5 px-5 py-2.5 rounded-full",
              "glass-premium border transition-all duration-200",
              pill.hasContent ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/30"
            )}
          >
            <pill.icon className={cn(
              "w-4 h-4 transition-colors",
              pill.hasContent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
            
            <span className={cn(
              "text-sm font-medium transition-colors",
              pill.hasContent ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {pill.label}
            </span>
            
            {pill.hasContent ? (
              <span className="flex items-center gap-1.5">
                <span className="text-sm text-primary">{pill.count || "✓"}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(pill.id); }}
                  className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ) : (
              <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
