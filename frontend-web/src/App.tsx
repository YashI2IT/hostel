import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HostelProvider, useHostel } from "./context/HostelContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FloorMap from "./pages/FloorMap";
import Residents from "./pages/Residents";
import Complaints from "./pages/Complaints";
import RoomManagement from "./pages/RoomManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useHostel();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useHostel();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/floor-map" 
        element={
          <ProtectedRoute>
            <FloorMap />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/residents" 
        element={
          <ProtectedRoute>
            <Residents />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/complaints" 
        element={
          <ProtectedRoute>
            <Complaints />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/room-management" 
        element={
          <ProtectedRoute>
            <RoomManagement />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HostelProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </HostelProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
