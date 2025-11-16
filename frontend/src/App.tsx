import { TooltipProvider } from "@/components/ui/core";
import { Toaster, SonnerToaster } from "@/components/ui/composed";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SiwbIdentityProvider } from "@/lib/siwb-identity";

import { RoleProvider } from "./contexts/RoleContext";
import { RouteProvider } from "./contexts/RouteContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { idlFactory as siwbIdlFactory } from "@/declarations/ic_siwb_provider/ic_siwb_provider.did.js";
import type { _SERVICE as SiwbProvider } from "@/declarations/ic_siwb_provider/ic_siwb_provider.did.d.ts";

import AuthPage from "@/features/auth";
import { HomePage, BlogPage, CommunityPage, PostViewerPage, CreatorPage } from "@/features/marketing";
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
import DocPage from "@/components/docs/DocPage";

const queryClient = new QueryClient();
const siwbCanisterId = import.meta.env.VITE_SIWB_PROVIDER_CANISTER_ID;
if (!siwbCanisterId) {
  throw new Error("VITE_SIWB_PROVIDER_CANISTER_ID is required to use SIWB authentication.");
}
const siwbHost = import.meta.env.VITE_SIWB_PROVIDER_HOST || import.meta.env.VITE_IC_HOST || "https://icp-api.io";
const SiwbProviderWrapper = SiwbIdentityProvider<SiwbProvider>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SiwbProviderWrapper
        idlFactory={siwbIdlFactory}
        canisterId={siwbCanisterId}
        httpAgentOptions={{ host: siwbHost }}
      >
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
                    <Route path="/creator" element={<CreatorPage />} />
                    <Route path="/auth" element={<AuthPage />} />

                    {/* Docs (all enclosed by DocsLayout) */}
                    <Route path="/docs" element={<DocsLayout />}>
                      <Route index element={<DocsIndex />} />
                      <Route path="*" element={<DocPage />} />
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
      </SiwbProviderWrapper>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
