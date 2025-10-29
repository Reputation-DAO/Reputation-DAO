import { TooltipProvider } from "@/components/ui/core";
import { Toaster, SonnerToaster } from "@/components/ui/composed";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { RoleProvider } from "./contexts/RoleContext";
import { RouteProvider } from "./contexts/RouteContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import AuthPage from "@/features/auth";
import { HomePage, BlogPage, CommunityPage, PostViewerPage } from "@/features/marketing";
import OrgSelectorPage from "@/features/orgs";

import DashboardPage, {
  AwardRepPage,
  RevokeRepPage,
  ManageAwardersPage,
  ViewBalancesPage,
  TransactionLogPage,
  DecaySystemPage,
  SettingsAdminPage,
} from "@/features/dashboard";
import { NotFoundPage } from "@/features/common";

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
                  <Route path="/" element={<HomePage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/posts/:id" element={<PostViewerPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/auth" element={<AuthPage />} />

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
                  <Route path="/org-selector" element={<OrgSelectorPage />} />
                  <Route path="/dashboard/home/:cid" element={<DashboardPage />} />
                  <Route path="/dashboard/award-rep/:cid" element={<AwardRepPage />} />
                  <Route path="/dashboard/revoke-rep/:cid" element={<RevokeRepPage />} />
                  <Route path="/dashboard/manage-awarders/:cid" element={<ManageAwardersPage />} />
                  <Route path="/dashboard/view-balances/:cid" element={<ViewBalancesPage />} />
                  <Route path="/dashboard/transaction-log/:cid" element={<TransactionLogPage />} />
                  <Route path="/dashboard/decay-system/:cid" element={<DecaySystemPage />} />
                  <Route path="/dashboard/settings/:cid" element={<SettingsAdminPage />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
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
