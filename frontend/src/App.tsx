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
import DecaySystemPage from './pages/DecaySystemPage';
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
          {/* Public Routes */}
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
            path="/Auth"
            element={
              <Auth />
            }
          />

          {/* Protected Routes */}
          {/* Dashboard - All roles can access */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder', 'User']}>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Decay System - All roles can access */}
          <Route
            path="/decay"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder', 'User']}>
                  <DecaySystemPage />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Award Reputation - Admin and Awarder only */}
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

          {/* Revoke Reputation - Admin only */}
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

          {/* Manage Awarders - Admin only */}
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

          {/* View Balances - All roles can access */}
          <Route
            path="/balances"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder', 'User']}>
                  <ViewBalances />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Transaction Log - All roles can access */}
          <Route
            path="/transactions"
            element={
              <Layout>
                <ProtectedRoute allowedRoles={['Admin', 'Awarder', 'User']}>
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
