import { motion } from "framer-motion";
import { Grid3X3, Image, Palette, Package, Lightbulb, X, Plus } from "lucide-react";
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
  styleRefs: UploadedItem[];
  products: Array<{ name: string; imageUrl?: string }>;
  onCardClick: (id: "layout" | "room" | "style" | "products" | "rcp") => void;
  onClear: (id: "layout" | "room" | "style" | "products" | "rcp") => void;
}

export function InputCards({
  layout,
  roomPhoto,
  ceilingPlan,
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
      id: "products" as const,
      icon: Package,
      label: "Products",
      hasContent: products.length > 0,
      count: products.length,
    },
  ];

  return (
    <div className="w-full max-w-4xl space-y-8 mb-8">
      {/* Primary Inputs - Large Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {primaryInputs.map((card, index) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCardClick(card.id)}
            className="relative group"
          >
            {/* Animated gradient border */}
            <div className={cn(
              "absolute -inset-[2px] rounded-3xl opacity-60 transition-opacity duration-500",
              "bg-gradient-to-r from-primary via-violet-500 to-primary bg-[length:200%_100%]",
              "group-hover:opacity-100",
              card.hasContent && "opacity-80"
            )} style={{ animation: 'gradient-x 3s ease infinite' }} />
            
            {/* Card content */}
            <div className={cn(
              "relative flex flex-col items-center justify-center p-10 rounded-3xl",
              "bg-background/95 backdrop-blur-sm",
              "min-h-[200px] transition-all duration-300"
            )}>
              {/* Preview image background */}
              {card.preview && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <img 
                    src={card.preview} 
                    alt="" 
                    className="w-full h-full object-cover opacity-20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />
                </div>
              )}
              
              {/* Clear button */}
              {card.hasContent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear(card.id);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Icon with glow */}
              <div className={cn(
                "relative p-5 rounded-2xl mb-5 transition-all duration-300",
                card.hasContent 
                  ? "bg-primary/20 shadow-[0_0_30px_hsl(217_100%_58%/0.3)]" 
                  : "bg-muted/30 group-hover:bg-primary/10 group-hover:shadow-[0_0_20px_hsl(217_100%_58%/0.2)]"
              )}>
                <card.icon
                  className={cn(
                    "w-10 h-10 transition-all duration-300",
                    card.hasContent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )}
                />
              </div>
              
              {/* Text */}
              <span className="relative text-xl font-semibold text-foreground mb-2">
                {card.title}
              </span>
              <span className="relative text-sm text-muted-foreground">
                {card.hasContent ? "Uploaded" : card.description}
              </span>
              
              {/* Success indicator */}
              {card.hasContent && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-primary to-violet-500 rounded-full"
                />
              )}
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Secondary Inputs Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Secondary References
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </motion.div>

      {/* Secondary Inputs - Compact Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {secondaryInputs.map((pill, index) => (
          <motion.button
            key={pill.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 + index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCardClick(pill.id)}
            className={cn(
              "group relative flex items-center gap-3 px-5 py-3 rounded-full",
              "glass-premium border transition-all duration-300",
              pill.hasContent
                ? "border-primary/40 bg-primary/10"
                : "border-border/50 hover:border-primary/40"
            )}
          >
            <pill.icon className={cn(
              "w-4 h-4 transition-colors duration-300",
              pill.hasContent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
            
            <span className={cn(
              "text-sm font-medium transition-colors duration-300",
              pill.hasContent ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {pill.label}
            </span>
            
            {/* Count badge or plus icon */}
            {pill.hasContent ? (
              <span className="flex items-center gap-1">
                <span className="text-xs text-primary font-medium">
                  {pill.count ? `${pill.count}` : "✓"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear(pill.id);
                  }}
                  className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ) : (
              <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
