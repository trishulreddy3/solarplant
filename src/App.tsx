import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/routing/ErrorBoundary";
import RouteGuard from "@/components/routing/RouteGuard";
import NavigationManager from "@/components/routing/NavigationManager";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { ROUTES } from "@/config/routes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteGuard>
              <NavigationManager>
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path={ROUTES.LOGIN.path} 
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <Welcome />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Protected Routes */}
                  <Route 
                    path={ROUTES.DASHBOARD.path} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 Route */}
                  <Route 
                    path={ROUTES.NOT_FOUND.path} 
                    element={<NotFound />} 
                  />
                </Routes>
              </NavigationManager>
            </RouteGuard>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
