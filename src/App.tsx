import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BudgetApp from "./pages/BudgetApp";
import InvestmentsPage from "./pages/Investments";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/Login";
import { useEffect, useState, useLayoutEffect } from "react";
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from "firebase/auth";
import { CurrencyProvider } from "./context/CurrencyContext";
import { DateRangeProvider } from "./context/DateRangeContext";
import { useTheme } from "./hooks/use-theme"; // Import the new useTheme hook

const queryClient = new QueryClient();

// ProtectedRoute component to guard authenticated routes
interface ProtectedRouteProps {
  children: React.ReactNode;
  userUid: string | null;
  isAuthenticated: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userUid, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const [userUid, setUserUid] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const { toggleTheme } = useTheme(); // Use the new useTheme hook

  // Removed the previous useLayoutEffect for theme, as useTheme hook now handles it.

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Set persistence to local storage
        await setPersistence(auth, browserLocalPersistence);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && !user.isAnonymous) {
            // User is signed in and is NOT anonymous
            setUserUid(user.uid);
            setIsAuthenticated(true);
          } else {
            // No user is signed in, or it's an anonymous user
            setUserUid(null);
            setIsAuthenticated(false);
          }
          setAuthLoading(false);
        });
        return () => unsubscribe(); // Clean up the listener
      } catch (error) {
        console.error("Error setting Firebase persistence:", error);
        setAuthLoading(false);
        // Handle error, e.g., show a message to the user
      }
    };

    setupAuth();
  }, []);

  // Add global keyboard shortcut for theme toggle (Ctrl + T)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault(); // Prevent default browser behavior (e.g., opening new tab)
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTheme]); // Depend on toggleTheme to ensure it's always the latest version

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg text-muted-foreground">Loading application...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CurrencyProvider>
            <DateRangeProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute userUid={userUid} isAuthenticated={isAuthenticated}>
                      <Index userUid={userUid} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/budget-app"
                  element={
                    <ProtectedRoute userUid={userUid} isAuthenticated={isAuthenticated}>
                      <BudgetApp userUid={userUid} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/budget-app/:view"
                  element={
                    <ProtectedRoute userUid={userUid} isAuthenticated={isAuthenticated}>
                      <BudgetApp userUid={userUid} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investments"
                  element={
                    <ProtectedRoute userUid={userUid} isAuthenticated={isAuthenticated}>
                      <InvestmentsPage userUid={userUid} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute userUid={userUid} isAuthenticated={isAuthenticated}>
                      <SettingsPage userUid={userUid} />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DateRangeProvider>
          </CurrencyProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;