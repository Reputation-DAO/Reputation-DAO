import React from 'react';
import type { ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Lock, ArrowBack } from '@mui/icons-material';
import { useRole } from '../contexts/RoleContext';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('Admin' | 'Awarder' | 'User')[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}) => {
  const { userRole, userName } = useRole();
  const navigate = useNavigate();

  // Show loading only for the "Loading" state
  if (userRole === 'Loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'hsl(var(--background))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
          Determining user role...
        </Typography>
      </Box>
    );
  }

  // Check if user has permission
  if (!allowedRoles.includes(userRole as any)) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'hsl(var(--background))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: 500,
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            p: 6,
          }}
        >
          <Lock
            sx={{
              fontSize: 64,
              color: 'hsl(var(--muted-foreground))',
              mb: 2,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: 'hsl(var(--foreground))',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Access Denied
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'hsl(var(--muted-foreground))',
              mb: 3,
            }}
          >
            Sorry {userName}, you don't have permission to access this page.
          </Typography>
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Required roles:</strong> {allowedRoles.join(', ')}
              <br />
              <strong>Your role:</strong> {userRole}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate(fallbackPath)}
            sx={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              '&:hover': {
                backgroundColor: 'hsl(var(--primary) / 0.8)',
              },
            }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};
