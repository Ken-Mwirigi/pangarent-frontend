import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Billing from "./pages/Billing";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import TenantDashboard from "./pages/TenantDashboard";
import BillingHistory from "./pages/BillingHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ... (keep your imports at the top)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const LandlordRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const role = localStorage.getItem('user_role'); // Force read
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'tenant') return <Navigate to="/tenant-dashboard" replace />;
  
  return <AppLayout>{children}</AppLayout>;
};

const TenantRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const role = localStorage.getItem('user_role'); // Force read
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'tenant') return <Navigate to="/dashboard" replace />; // If they aren't a tenant, kick them to dashboard
  
  return <AppLayout>{children}</AppLayout>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const role = localStorage.getItem('user_role'); // Force read

  if (isAuthenticated) {
    if (role === 'tenant') {
      return <Navigate to="/tenant-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth(); 

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated 
          ? (role === 'tenant' ? <Navigate to="/tenant-dashboard" replace /> : <Navigate to="/dashboard" replace />)
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
      <Route path="/reset-password/:uid/:token" element={<AuthRoute><ResetPassword /></AuthRoute>} />
      <Route path="/verify" element={<AuthRoute><VerifyOTP /></AuthRoute>} />
      
      {/* 3. WRAP LANDLORD ROUTES IN LandlordRoute */}
      <Route path="/dashboard" element={<LandlordRoute><Dashboard /></LandlordRoute>} />
      <Route path="/properties" element={<LandlordRoute><Properties /></LandlordRoute>} />
      <Route path="/tenants" element={<LandlordRoute><Tenants /></LandlordRoute>} />
      <Route path="/billing" element={<LandlordRoute><Billing /></LandlordRoute>} />
      <Route path="/invoices" element={<LandlordRoute><Invoices /></LandlordRoute>} />
      <Route path="/reports" element={<LandlordRoute><Reports /></LandlordRoute>} />
      <Route path="/notifications" element={<LandlordRoute><Notifications /></LandlordRoute>} />

      {/* 4. WRAP TENANT ROUTES IN TenantRoute */}
      <Route path="/tenant-dashboard" element={<TenantRoute><TenantDashboard /></TenantRoute>} />
      <Route path="/tenant-invoices" element={<TenantRoute><Invoices /></TenantRoute>} /> 
      <Route path="/billing-history" element={<TenantRoute><BillingHistory /></TenantRoute>} />
      <Route path="/tenant-notifications" element={<TenantRoute><Notifications /></TenantRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;