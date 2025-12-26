import { motion, type Transition } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: "blur(4px)",
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94] as const,
  duration: 0.4,
};

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
