import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import VendorDashboard from "@/pages/VendorDashboard";
import LayoutCreator from "@/pages/LayoutCreator";
import CreateCustomFurniture from "@/pages/CreateCustomFurniture";
import CustomFurnitureLibrary from "@/pages/CustomFurnitureLibrary";
import AgentBOnboarding from "@/pages/AgentBOnboarding";
import AgentBBrain from "@/pages/AgentBBrain";
import DrawingToolWorkspace from "@/pages/DrawingToolWorkspace";
import SharedProductView from "@/pages/SharedProductView";
import DesignWizard from "@/pages/DesignWizard";

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace" element={<Index />} />
        <Route path="/onboarding" element={<AgentBOnboarding />} />
        <Route path="/agent-b/brain" element={<AgentBBrain />} />
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/layout-creator" element={<LayoutCreator />} />
        <Route path="/create-furniture" element={<CreateCustomFurniture />} />
        <Route path="/custom-furniture/create" element={<CreateCustomFurniture />} />
        <Route path="/furniture-library" element={<CustomFurnitureLibrary />} />
        <Route path="/custom-furniture" element={<CustomFurnitureLibrary />} />
        <Route path="/shared/:shareToken" element={<SharedProductView />} />
        <Route path="/tools/:toolType" element={<DrawingToolWorkspace />} />
        <Route path="/design-wizard" element={<DesignWizard />} />
        <Route path="/design-wizard/:sessionId" element={<DesignWizard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
