import { TooltipProvider } from "@/components/ui/core";
import { Toaster, SonnerToaster } from "@/components/ui/composed";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { RoleProvider } from "./contexts/RoleContext";
import { RouteProvider } from "./contexts/RouteContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// pages
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Community from "./pages/Community";
import Auth from "./pages/Auth";
import OrgSelector from "./pages/OrgSelector";
import Dashboard from "./features/dashboard";
import AwardRep from "./pages/AwardRep";
import RevokeRep from "./pages/RevokeRep";
import ManageAwarders from "./pages/ManageAwarders";
import ViewBalances from "./pages/ViewBalances";
import TransactionLog from "./pages/TransactionLog";
import DecaySystem from "./pages/DecaySystem";
import NotFound from "./pages/NotFound";
import PostViewer from "./pages/PostViewer";

// docs layout + sections
import DocsLayout from "@/components/layout/DocsLayout";
import DocsIndex from "@/components/docs/DocsIndex";
import GettingStarted from "@/components/docs/GettingStarted";
import SmartContracts from "@/components/docs/SmartContracts";
import ApiReference from "@/components/docs/ApiReference";
import Sdks from "@/components/docs/Sdks";
import SecurityGuide from "@/components/docs/SecurityGuide";
import CommunityResources from "@/components/docs/CommunityResources";
import CliReference from "@/components/docs/CliReference";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouteProvider>
            <RoleProvider>
              <TooltipProvider>
                <Toaster />
                <SonnerToaster />
                <Routes>
                  {/* Marketing / top-level */}
                  <Route path="/" element={<Home />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/posts/:id" element={<PostViewer />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/auth" element={<Auth />} />

                  {/* Docs (all enclosed by DocsLayout) */}
                  <Route path="/docs" element={<DocsLayout />}>
                    <Route index element={<DocsIndex />} />
                    <Route path="getting-started" element={<GettingStarted />} />
                    <Route path="smart-contracts" element={<SmartContracts />} />
                    <Route path="api" element={<ApiReference />} />
                    <Route path="cli" element={<CliReference />} />
                    <Route path="sdks" element={<Sdks />} />
                    <Route path="security" element={<SecurityGuide />} />
                    <Route path="community" element={<CommunityResources />} />
                  </Route>

                  {/* App flows */}
                  <Route path="/org-selector" element={<OrgSelector />} />
                  <Route path="/dashboard/home/:cid" element={<Dashboard />} />
                  <Route path="/dashboard/award-rep/:cid" element={<AwardRep />} />
                  <Route path="/dashboard/revoke-rep/:cid" element={<RevokeRep />} />
                  <Route path="/dashboard/manage-awarders/:cid" element={<ManageAwarders />} />
                  <Route path="/dashboard/view-balances/:cid" element={<ViewBalances />} />
                  <Route path="/dashboard/transaction-log/:cid" element={<TransactionLog />} />
                  <Route path="/dashboard/decay-system/:cid" element={<DecaySystem />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </RoleProvider>
          </RouteProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
