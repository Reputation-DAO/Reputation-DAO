import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "./contexts/RoleContext";
import { RouteProvider } from "./contexts/RouteContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Docs from "./pages/Docs";
import Blog from "./pages/Blog";
import Community from "./pages/Community";
import Auth from "./pages/Auth";
import OrgSelector from "./pages/OrgSelector";
import Dashboard from "./pages/Dashboard";
import AwardRep from "./pages/AwardRep";
import RevokeRep from "./pages/RevokeRep";
import ManageAwarders from "./pages/ManageAwarders";
import ViewBalances from "./pages/ViewBalances";
import TransactionLog from "./pages/TransactionLog";
import DecaySystem from "./pages/DecaySystem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteProvider>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/community" element={<Community />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/org-selector" element={<OrgSelector />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/award-rep" element={<AwardRep />} />
              <Route path="/revoke-rep" element={<RevokeRep />} />
              <Route path="/manage-awarders" element={<ManageAwarders />} />
              <Route path="/view-balances" element={<ViewBalances />} />
              <Route path="/transaction-log" element={<TransactionLog />} />
              <Route path="/decay-system" element={<DecaySystem />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </RouteProvider>
          </BrowserRouter>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
