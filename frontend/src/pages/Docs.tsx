// @ts-nocheck (remove once you add proper types to all sections)
import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Container,
  keyframes,
} from '@mui/material';

import DocsContentGettingStarted from '../components/docs/GettingStarted';
import DocsContentArchitecture from '../components/docs/Architecture';
import DocsContentSmartContract from '../components/docs/SmartContract';
import DocsContentAPI from '../components/docs/API';
import DocsContentIntegrationGuide from '../components/docs/IntegrationGuide';
import DocsContentGovernance from '../components/docs/Governance';

const navItems = [
  'Getting Started',
  'Architecture Overview',
  'Smart Contracts',
  'API Reference',
  'Integration Guide (Plug, Internet Identity, Stoic)',
  'Governance Rules',
];

const contentComponents = [
  <DocsContentGettingStarted />,
  <DocsContentArchitecture />,
  <DocsContentSmartContract />,
  <DocsContentAPI />,
  <DocsContentIntegrationGuide />,
  <DocsContentGovernance />,
];

// Heartbeat glow animation
const heartbeatGlow = keyframes`
  0% {
    opacity: 0.06;
    filter: blur(25px);
  }
  20% {
    opacity: 0.14;
    filter: blur(40px);
  }
  50% {
    opacity: 0.36;
    filter: blur(50px);
  }
  80% {
    opacity: 0.14;
    filter: blur(40px);
  }
  100% {
    opacity: 0.06;
    filter: blur(25px);
  }
`;

export default function DocsLayout() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Box
      sx={{
        position: 'relative', // for glow positioning
        bgcolor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        overflow: 'hidden', // hide glow overflow
        minHeight: '100vh',
      }}
    >
      <CssBaseline />

      {/* Left Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100px',
          height: '100%',
          background: 'hsl(var(--primary))',
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          borderRadius: '0 100px 100px 0',
        }}
      />

      {/* Right Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100%',
          background: 'hsl(var(--primary))',
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          borderRadius: '100px 0 0 100px',
        }}
      />

      {/* Main Docs Content */}
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          py: 4,
          px: 5,
          gap: 4,
          position: 'relative',
          zIndex: 1, // keep content above glow
        }}
      >
        {/* Sidebar */}
        <Paper
          component="aside"
          elevation={6}
          sx={{
            width: 260,
            flexShrink: 0,
            bgcolor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            py: 3,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'calc(var(--radius) * 1.5)',
            height: 'calc(100vh - 28px)',
            position: 'sticky',
            top: 96,
            boxShadow:
              '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 0 1px hsl(var(--border))',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
              mb: 2,
              fontSize: 14,
              px: 1,
              color: 'hsl(var(--foreground))',
              textTransform: 'uppercase',
            }}
          >
            Documentation
          </Typography>

          <List dense disablePadding>
            {navItems.map((text, idx) => (
              <ListItemButton
                key={idx}
                selected={idx === activeIndex}
                onClick={() => setActiveIndex(idx)}
                sx={{
                  py: 1,
                  px: 1.5,
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--foreground))',
                  fontWeight: idx === activeIndex ? 600 : 500,
                  transition: 'all 0.25s ease',
                  '&.Mui-selected': {
                    bgcolor: 'hsl(var(--primary) / 0.15)',
                    color: 'hsl(var(--foreground))',
                    boxShadow: 'inset 0 0 0 1px hsl(var(--primary))',
                  },
                  '&:hover': {
                    bgcolor: 'hsl(var(--primary) / 0.08)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemText
                  primaryTypographyProps={{
                    fontSize: 13,
                    fontWeight: idx === activeIndex ? 600 : 500,
                  }}
                  primary={text}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* Docs Content */}
        <Box
          component={Paper}
          elevation={4}
          sx={{
            flexGrow: 1,
            bgcolor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            px: 5,
            py: 3,
            color: 'hsl(var(--foreground))',
            borderRadius: 'var(--radius)',
            height: 'calc(100vh - 28px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'hsl(var(--primary) / 0.7)',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'hsl(var(--primary))',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--primary) / 0.7) transparent',
          }}
        >
          {contentComponents[activeIndex]}
        </Box>
      </Container>
    </Box>
  );
}
