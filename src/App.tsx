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
import { useEffect, useState } from "react"; // Import useState
import { useTheme } from "./hooks/use-theme";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import SyncStatusIndicator from "./components/common/SyncStatusIndicator";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { DateRangeProvider } from "./context/DateRangeContext";
import ProfilePopup from "./components/ProfilePopup"; // Import ProfilePopup
import { cn } from "./lib/utils"; // Import cn

const queryClient = new QueryClient();

// ProtectedRoute component to guard authenticated routes
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg text-muted-foreground">Loading authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const { userUid, authLoading } = useAuth();
  const { toggleTheme } = useTheme();
  const [showProfilePopup, setShowProfilePopup] = useState(false); // State for ProfilePopup

  // Add global keyboard shortcut for theme toggle (Ctrl + T)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTheme]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg text-muted-foreground">Loading application...</span>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CurrencyProvider>
              <DateRangeProvider>
                <div className="flex flex-col min-h-screen"> {/* Main app container */}
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Index userUid={userUid} setShowProfilePopup={setShowProfilePopup} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/budget-app"
                      element={
                        <ProtectedRoute>
                          <BudgetApp userUid={userUid} setShowProfilePopup={setShowProfilePopup} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/budget-app/:view"
                      element={
                        <ProtectedRoute>
                          <BudgetApp userUid={userUid} setShowProfilePopup={setShowProfilePopup} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/investments"
                      element={
                        <ProtectedRoute>
                          <InvestmentsPage userUid={userUid} setShowProfilePopup={setShowProfilePopup} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage userUid={userUid} setShowProfilePopup={setShowProfilePopup} />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <SyncStatusIndicator />
                  <ProfilePopup isOpen={showProfilePopup} onClose={() => setShowProfilePopup(false)} />
                </div>
              </DateRangeProvider>
            </CurrencyProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;