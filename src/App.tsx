import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BudgetApp from "./pages/BudgetApp";
import InvestmentsPage from "./pages/Investments";
import { useState } from "react"; // Keep useState for potential future local state

const queryClient = new QueryClient();

const App = () => {
  // userUid and authLoading state removed as Firebase auth is being removed.
  // If you re-implement auth with Supabase, this logic will be added back.

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* userUid prop removed as Firebase auth is no longer managing it */}
            <Route path="/budget-app" element={<BudgetApp />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;