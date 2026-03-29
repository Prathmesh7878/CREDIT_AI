import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AIChatbot } from "@/components/AIChatbot";
import Dashboard from "./pages/Dashboard";
import BorrowerProfile from "./pages/BorrowerProfile";
import ModelPerformance from "./pages/ModelPerformance";
import FairnessAudit from "./pages/FairnessAudit";
import ScoreBorrower from "./pages/ScoreBorrower";
import LoanAnalytics from "./pages/LoanAnalytics";
import NotFound from "./pages/NotFound";
import "@/i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/borrower" element={<BorrowerProfile />} />
              <Route path="/model" element={<ModelPerformance />} />
              <Route path="/fairness" element={<FairnessAudit />} />
              <Route path="/score" element={<ScoreBorrower />} />
              <Route path="/analytics" element={<LoanAnalytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
          <AIChatbot />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
