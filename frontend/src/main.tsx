// ===== Polyfills for ICP compatibility =====
import { Buffer } from 'buffer';

(window as any).global ||= window;
(window as any).Buffer ||= Buffer;
(window as any).process ||= { env: {} };

// ===== App Bootstrapping =====
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import App from './App';
import { RoleProvider } from './RoleContext';
import { Connect2ICProvider, client } from './connect2ic';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Render root
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Connect2ICProvider client={client}>
        <RoleProvider>
          <App />
        </RoleProvider>
      </Connect2ICProvider>
    </ThemeProvider>
  </StrictMode>
);
