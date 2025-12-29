import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Zap } from "lucide-react";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex items-center justify-between px-8 py-5"
    >
      <div className="flex items-center gap-12">
        {/* Brand with lightning icon */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div className="absolute inset-0 blur-md bg-cyan-400/50" />
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Agent B</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200">
            Features
          </a>
          <a href="#" className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200">
            Pricing
          </a>
          <a href="#" className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors duration-200">
            Gallery
          </a>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <Button 
            onClick={() => navigate("/workspace")}
            className="bg-cyan-500 hover:bg-cyan-400 text-background font-medium px-5 shadow-[0_0_20px_hsl(185_100%_50%/0.3)] hover:shadow-[0_0_30px_hsl(185_100%_50%/0.5)] transition-all"
          >
            Go to Workspace
          </Button>
        ) : (
          <>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
            >
              Log In
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-cyan-500 hover:bg-cyan-400 text-background font-medium px-5 shadow-[0_0_20px_hsl(185_100%_50%/0.3)] hover:shadow-[0_0_30px_hsl(185_100%_50%/0.5)] transition-all"
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    </motion.header>
  );
}
