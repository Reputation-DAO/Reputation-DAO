
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomeLayout from './components/layout/HomePageLayout';

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
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="/award"
          element={
            <Layout>
              <AwardRep />
            </Layout>
          }
        />
        <Route
          path="/revoke"
          element={
            <Layout>
              <RevokeRep />
            </Layout>
          }
        />
        <Route
          path="/awarders"
          element={
            <Layout>
              <ManageAwarders />
            </Layout>
          }
        />
        <Route
          path="/balances"
          element={
            <Layout>
              <ViewBalances />
            </Layout>
          }
        />
        <Route
          path="/transactions"
          element={
            <Layout>
              <TransactionLogSimple />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
