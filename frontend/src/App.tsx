
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

import Dashboard from './pages/Dashboard';
import AwardRep from './pages/AwardRep';
import RevokeRep from './pages/RevokeRep';
import ManageAwarders from './pages/ManageAwarders';
import ViewBalances from './pages/ViewBalances';
import TransactionLogSimple from './pages/TransactionLogSimple';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
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
