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

export default function DocsLayout() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: 'flex',
        py: 4,
        px: 5,
        bgcolor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        gap: 4,
      }}
    >
      <CssBaseline />

      {/* Sidebar */}
      {/* Sidebar */}
<Paper
  component="aside"
  elevation={6}
  sx={{
    width: 260,
    flexShrink: 0,
    bgcolor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    py: 3,
    px: 2,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'calc(var(--radius) * 1.5)', // smoother corners
    height: 'calc(100vh - 128px)', // match content height
    position: 'sticky',
    top: 96,
    boxShadow:
      '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 0 0 1px hsl(var(--border))', // soft outer + subtle inner border
    backdropFilter: 'blur(8px)', // glassy effect if background allows
    overflow: 'hidden', // clip ripple effects
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
    bgcolor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    px: 5,
    py: 3,
    color:"hsl(var(--foreground))",
    borderRadius: 'var(--radius)',
    height: 'calc(100vh - 128px)', // same height as sidebar
    overflowY: 'auto', // scroll internally if content is long
    /* Scrollbar Styling */
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
    scrollbarWidth: 'thin', // Firefox
    scrollbarColor: 'hsl(var(--primary) / 0.7) transparent', // Firefox
  }}
>
  {contentComponents[activeIndex]}
</Box>

    </Container>
  );
}
