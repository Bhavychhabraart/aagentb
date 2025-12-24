import { motion } from "framer-motion";
import { Grid3X3, Image, Palette, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedItem {
  file?: File;
  preview: string;
  name: string;
}

interface InputCardsProps {
  layout?: UploadedItem;
  roomPhoto?: UploadedItem;
  styleRefs: UploadedItem[];
  products: Array<{ name: string; imageUrl?: string }>;
  onCardClick: (id: "layout" | "room" | "style" | "products") => void;
  onClear: (id: "layout" | "room" | "style" | "products") => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

export function InputCards({
  layout,
  roomPhoto,
  styleRefs,
  products,
  onCardClick,
  onClear,
}: InputCardsProps) {
  const inputCards = [
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
    {
      id: "style" as const,
      icon: Palette,
      title: "Style Ref",
      description: "Add mood board",
      hasContent: styleRefs.length > 0,
      count: styleRefs.length,
      preview: styleRefs[0]?.preview,
    },
    {
      id: "products" as const,
      icon: Package,
      title: "Products",
      description: "Add furniture",
      hasContent: products.length > 0,
      count: products.length,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-4xl">
      {inputCards.map((card, index) => (
        <motion.button
          key={card.id}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCardClick(card.id)}
          className={cn(
            "relative group flex flex-col items-center justify-center",
            "p-6 rounded-2xl border-2 transition-all duration-300",
            "overflow-hidden",
            card.hasContent
              ? "bg-primary/5 border-primary/30 shadow-[0_0_30px_hsl(217_100%_58%/0.1)]"
              : "glass border-border/50 hover:border-primary/40 hover:bg-card/80"
          )}
        >
          {/* Preview image background */}
          {card.preview && (
            <div className="absolute inset-0 opacity-20">
              <img 
                src={card.preview} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />
            </div>
          )}
          
          {/* Clear button */}
          {card.hasContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear(card.id);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          
          {/* Icon */}
          <div className={cn(
            "relative p-3 rounded-xl mb-3 transition-all duration-300",
            card.hasContent 
              ? "bg-primary/20" 
              : "bg-muted/50 group-hover:bg-primary/10"
          )}>
            <card.icon
              className={cn(
                "w-6 h-6 transition-colors duration-300",
                card.hasContent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )}
            />
          </div>
          
          {/* Text */}
          <span className="relative text-sm font-semibold text-foreground mb-1">
            {card.title}
          </span>
          <span className="relative text-xs text-muted-foreground">
            {card.hasContent
              ? card.count
                ? `${card.count} added`
                : "Added"
              : card.description}
          </span>
          
          {/* Active indicator */}
          {card.hasContent && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
