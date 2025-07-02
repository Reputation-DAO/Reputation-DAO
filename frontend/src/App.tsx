import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import Dashboard from './pages/Dashboard';
import AwardRep from './pages/AwardRep';
import RevokeRep from './pages/RevokeRep';
import ManageAwarders from './pages/ManageAwarders';
import ViewBalances from './pages/ViewBalances';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/award" element={<AwardRep />} />
          <Route path="/revoke" element={<RevokeRep />} />
          <Route path="/awarders" element={<ManageAwarders />} />
          <Route path="/balances" element={<ViewBalances />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
