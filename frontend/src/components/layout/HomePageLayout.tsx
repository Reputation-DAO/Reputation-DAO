import React from 'react';
import { CssBaseline } from '@mui/material';
import Header from '../landing_page/Header';
import Footer from '../landing_page/footer';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors">
      <CssBaseline />
      <Header />
      <main className="flex-grow py-12 max-w-6xl mx-auto px-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
