import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

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
      className="relative z-10 flex items-center justify-between px-6 py-4"
    >
      <div className="flex items-center gap-10">
      <h1 className="text-xl font-bold text-foreground tracking-tight">Agent B</h1>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Product
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Pricing
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Gallery
          </a>
        </nav>
      </div>
      
      <div className="flex items-center gap-3">
        {user ? (
          <Button 
            variant="secondary" 
            onClick={() => navigate("/workspace")}
            className="glass border-border/50 hover:border-primary/40"
          >
            Go to Workspace
          </Button>
        ) : (
          <>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="text-muted-foreground hover:text-foreground"
            >
              Log In
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="btn-glow"
            >
              Try for free
            </Button>
          </>
        )}
      </div>
    </motion.header>
  );
}
