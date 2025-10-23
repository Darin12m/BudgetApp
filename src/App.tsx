import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BudgetApp from "./pages/BudgetApp";
import InvestmentsPage from "./pages/Investments";
import SettingsPage from "./pages/Settings"; // Import the new SettingsPage
import { useEffect, useState } from "react";
import { auth } from '@/lib/firebase'; // Import auth from the new firebase.ts
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

const queryClient = new QueryClient();

const App = () => {
  const [userUid, setUserUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in.
        setUserUid(user.uid);
        setAuthLoading(false);
      } else {
        // No user is signed in, sign in anonymously.
        signInAnonymously(auth)
          .then((credential) => {
            setUserUid(credential.user.uid);
            setAuthLoading(false);
          })
          .catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            setAuthLoading(false);
            // Handle error, maybe show a message to the user
          });
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading application...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index userUid={userUid} />} />
            <Route path="/budget-app" element={<BudgetApp userUid={userUid} />} />
            <Route path="/investments" element={<InvestmentsPage userUid={userUid} />} />
            <Route path="/settings" element={<SettingsPage userUid={userUid} />} /> {/* New Settings Route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;