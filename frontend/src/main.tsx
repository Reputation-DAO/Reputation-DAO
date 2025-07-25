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

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Render root
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
          <App />
    </ThemeProvider>
  </StrictMode>
);
