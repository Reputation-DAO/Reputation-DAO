
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomeLayout from './components/layout/HomePageLayout';
import { RoleProvider } from './contexts/RoleContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import AwardRep from './pages/AwardRep';
import RevokeRep from './pages/RevokeRep';
import ManageAwarders from './pages/ManageAwarders';
import ViewBalances from './pages/ViewBalances';
import TransactionLogSimple from './pages/TransactionLogSimple';
import LandingPage from './pages/LandingPage';
import Docs from './pages/Docs';
import Community from './pages/Community';
import Blog from './pages/Blog';
import Auth from './pages/Auth';

function App() {
  return (
    <RoleProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <HomeLayout>
                <LandingPage />
              </HomeLayout>
            }
          />
          <Route
            path="/Blog"
            element={
              <HomeLayout>
                <Blog />
              </HomeLayout>
            }
          />
          <Route
            path="/Docs"
            element={
              <HomeLayout>
                <Docs />
              </HomeLayout>
            }
          />
          <Route
            path="/Community"
            element={
              <HomeLayout>
                <Community />
              </HomeLayout>
            }
          />
          <Route
            path="/auth"
            element={
              <HomeLayout>
                <Auth />
              </HomeLayout>
            }
          />

          <Route
            path="/Dashboard"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder']}>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/award"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder']}>
                  <AwardRep />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/revoke"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin']}>
                  <RevokeRep />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/awarders"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin']}>
                  <ManageAwarders />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/balances"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder']}>
                  <ViewBalances />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/transactions"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder']}>
                  <TransactionLogSimple />
                </ProtectedRoute>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </RoleProvider>
  );
}

export default App;
