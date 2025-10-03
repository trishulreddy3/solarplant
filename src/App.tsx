import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import AdminLogin from "./pages/AdminLogin";
import UserLogin from "./pages/UserLogin";
import ForgotPassword from "./pages/ForgotPassword";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import PlantAdminDashboard from "./pages/PlantAdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import AddCompany from "./pages/AddCompany";
import Infrastructure from "./pages/Infrastructure";
import AddTable from "./pages/AddTable";
import ViewTables from "./pages/ViewTables";
import ExistingUsers from "./pages/ExistingUsers";
import AddUser from "./pages/AddUser";
import CompanyMonitor from "./pages/CompanyMonitor";
import PlantView from "./pages/PlantView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
          <Route path="/add-company" element={<AddCompany />} />
          <Route path="/company-monitor/:companyId" element={<CompanyMonitor />} />
          <Route path="/plant-view/:companyId" element={<PlantView />} />
          
          {/* Plant Admin Routes */}
          <Route path="/plant-admin-dashboard" element={<PlantAdminDashboard />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/add-table" element={<AddTable />} />
          <Route path="/view-tables" element={<ViewTables />} />
          <Route path="/existing-users" element={<ExistingUsers />} />
          <Route path="/add-user" element={<AddUser />} />
          
          {/* User Routes */}
          <Route path="/user-dashboard" element={<UserDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
