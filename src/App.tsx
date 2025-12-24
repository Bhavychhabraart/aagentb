import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import VendorDashboard from "./pages/VendorDashboard";
import LayoutCreator from "./pages/LayoutCreator";
import CreateCustomFurniture from "./pages/CreateCustomFurniture";
import CustomFurnitureLibrary from "./pages/CustomFurnitureLibrary";
import AgentBOnboarding from "./pages/AgentBOnboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workspace" element={<Index />} />
              <Route path="/onboarding" element={<AgentBOnboarding />} />
              <Route path="/vendor" element={<VendorDashboard />} />
              <Route path="/layout-creator" element={<LayoutCreator />} />
              <Route path="/create-furniture" element={<CreateCustomFurniture />} />
              <Route path="/furniture-library" element={<CustomFurnitureLibrary />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;