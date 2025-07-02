import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';


import App from './App';
import { RoleProvider } from './RoleContext';
import { Connect2ICProvider, client } from './connect2ic';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

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
