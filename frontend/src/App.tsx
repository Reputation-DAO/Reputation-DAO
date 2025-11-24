import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/core";
import { Toaster, SonnerToaster } from "@/components/ui/composed";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SiwbIdentityProvider } from "@/lib/siwb-identity";
import { SiweIdentityProvider } from "@/lib/siwe-identity";

import { RoleProvider } from "./contexts/RoleContext";
import { RouteProvider } from "./contexts/RouteContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { idlFactory as siwbIdlFactory } from "@/declarations/ic_siwb_provider/ic_siwb_provider.did.js";
import type { _SERVICE as SiwbProvider } from "@/declarations/ic_siwb_provider/ic_siwb_provider.did.d.ts";
import { idlFactory as siweIdlFactory } from "@/declarations/ic_siwe_provider/ic_siwe_provider.did.js";
import type { _SERVICE as SiweProvider } from "@/declarations/ic_siwe_provider/ic_siwe_provider.did.d.ts";

const AuthPage = lazy(() => import("@/features/auth/AuthPage"));
const HomePage = lazy(() => import("@/features/marketing/HomePage"));
const BlogPage = lazy(() => import("@/features/marketing/BlogPage"));
const CommunityPage = lazy(() => import("@/features/marketing/CommunityPage"));
const PostViewerPage = lazy(() => import("@/features/marketing/PostViewerPage"));
const CreatorPage = lazy(() => import("@/features/marketing/CreatorPage"));
const OrgSelectorPage = lazy(() => import("@/features/orgs/OrgSelectorPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const AwardRepPage = lazy(() => import("@/features/dashboard/pages/AwardRepPage"));
const RevokeRepPage = lazy(() => import("@/features/dashboard/pages/RevokeRepPage"));
const ManageAwardersPage = lazy(() => import("@/features/dashboard/pages/ManageAwardersPage"));
const ViewBalancesPage = lazy(() => import("@/features/dashboard/pages/ViewBalancesPage"));
const TransactionLogPage = lazy(() => import("@/features/dashboard/pages/TransactionLogPage"));
const DecaySystemPage = lazy(() => import("@/features/dashboard/pages/DecaySystemPage"));
const SettingsAdminPage = lazy(() => import("@/features/dashboard/pages/SettingsPage"));
const EconomySettingsPage = lazy(() => import("@/features/dashboard/pages/EconomySettingsPage"));
const MyEarningsPage = lazy(() => import("@/features/dashboard/pages/MyEarningsPage"));
const NotFoundPage = lazy(() => import("@/features/common/NotFoundPage"));

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

const siweCanisterId = import.meta.env.VITE_SIWE_PROVIDER_CANISTER_ID;
if (!siweCanisterId) {
  throw new Error("VITE_SIWE_PROVIDER_CANISTER_ID is required to use SIWE authentication.");
}
const siweHost = import.meta.env.VITE_SIWE_PROVIDER_HOST || import.meta.env.VITE_IC_HOST || "https://icp-api.io";
const SiweProviderWrapper = SiweIdentityProvider<SiweProvider>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SiwbProviderWrapper
        idlFactory={siwbIdlFactory}
        canisterId={siwbCanisterId}
        httpAgentOptions={{ host: siwbHost }}
      >
        <SiweProviderWrapper
          idlFactory={siweIdlFactory}
          canisterId={siweCanisterId}
          httpAgentOptions={{ host: siweHost }}
        >
          <AuthProvider>
            <BrowserRouter>
              <RouteProvider>
                <RoleProvider>
                  <TooltipProvider>
                    <Toaster />
                    <SonnerToaster />
                    <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
                        <Route path="/dashboard/economy-settings/:cid" element={<EconomySettingsPage />} />
                        <Route path="/dashboard/my-earnings/:cid" element={<MyEarningsPage />} />

                        {/* Catch-all */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                  </TooltipProvider>
                </RoleProvider>
              </RouteProvider>
            </BrowserRouter>
          </AuthProvider>
        </SiweProviderWrapper>
      </SiwbProviderWrapper>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
