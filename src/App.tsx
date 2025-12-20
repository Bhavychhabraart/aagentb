import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import VendorDashboard from "./pages/VendorDashboard";
import CustomFurnitureLibrary from "./pages/CustomFurnitureLibrary";
import CreateCustomFurniture from "./pages/CreateCustomFurniture";
import LayoutCreator from "./pages/LayoutCreator";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/workspace" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vendor" element={<VendorDashboard />} />
            <Route path="/custom-furniture" element={<CustomFurnitureLibrary />} />
            <Route path="/custom-furniture/create" element={<CreateCustomFurniture />} />
            <Route path="/layout-creator" element={<LayoutCreator />} />
            <Route path="/layout-creator/:id" element={<LayoutCreator />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;