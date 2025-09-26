import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserProfile } from "@/components/UserProfile";
import { AgeGate } from "@/components/AgeGate";
import { LandingPage } from "@/pages/LandingPage";
import { PricingPage } from "@/pages/PricingPage";
import Auth from "@/pages/Auth";
import Index from "./pages/EnhancedIndex";
import NotFound from "./pages/NotFound";
import Create from "./pages/Create";
import CreationSuccess from "./pages/CreationSuccess";
import CompanionLibrary from "./pages/CompanionLibrary";
import { AdminDashboard } from "./pages/AdminDashboard";
import { FooterNotice } from "@/components/FooterNotice";
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Support from './pages/Support';
import React, { useEffect } from 'react';

const queryClient = new QueryClient();

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      // Fallback for browsers not supporting the above
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname]);
  return null;
}

// New AppShell component to handle conditional rendering of FooterNotice
function AppShell() {
  const location = useLocation();
  // Hide footer if path starts with /app (e.g., /app, /app/chat, etc.)
  const showFooter = !location.pathname.startsWith('/app'); 

  return (
    <>
      <ScrollToTop />
      <AgeGate />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected app routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <Create />
          </ProtectedRoute>
        } />
        <Route path="/success" element={
          <ProtectedRoute>
            <CreationSuccess />
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <CompanionLibrary />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showFooter && <FooterNotice />} {/* Conditionally render FooterNotice */}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppShell /> {/* Render AppShell */}
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
