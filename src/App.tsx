
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Landing from "@/pages/Landing";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Family from "./pages/Family";
import Community from "./pages/Community";
import Tracking from "./pages/Tracking";
import HealthMetrics from "./pages/HealthMetrics";
import LabReports from "./pages/LabReports";
import Rewards from "./pages/Rewards";
import Kids from "./pages/Kids";
import FamilyInviteAccept from "./pages/FamilyInviteAccept";
import FamilyInviteComplete from "./pages/FamilyInviteComplete";
import OAuthCallback from "./components/OAuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <Router>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/family" element={<Family />} />
          <Route path="/community" element={<Community />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/health-metrics" element={<HealthMetrics />} />
          <Route path="/lab-reports" element={<LabReports />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/family-invite" element={<FamilyInviteAccept />} />
          <Route path="/family-invite-complete" element={<FamilyInviteComplete />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </TooltipProvider>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AppContent />
      </UserProvider>
  </QueryClientProvider>
);
}

export default App;
