import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Paper,
  useMediaQuery,
  Stack,
  keyframes,
} from '@mui/material';
import { CreditCard } from '@mui/icons-material';
import { styled } from '@mui/system';
import { Link as MuiLink } from '@mui/material';
import { useState } from "react";
import { useTheme } from '@mui/material/styles';

// Heartbeat glow keyframes
const heartbeatGlow = keyframes`
  0% { opacity: 0.06; filter: blur(15px); }
  20% { opacity: 0.14; filter: blur(25px); }
  50% { opacity: 0.36; filter: blur(35px); }
  80% { opacity: 0.14; filter: blur(25px); }
  100% { opacity: 0.06; filter: blur(15px); }
`;

const Root = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: 'hsl(var(--background))',
  padding: '1rem', // decreased padding
  position: 'relative',
  overflow: 'hidden',
  transition: 'background-color var(--transition-smooth)',
});

// Glows
const Glow = styled(Box)(({ side }: { side: 'left' | 'right' }) => ({
  position: 'absolute',
  top: 0,
  [side]: 0,
  width: '80px',
  height: '100%',
  background: 'hsl(var(--primary))',
  animation: `${heartbeatGlow} 10s ease-in-out infinite`,
  zIndex: 0,
  pointerEvents: 'none',
  mixBlendMode: 'screen',
  borderRadius: side === 'left' ? '0 80px 80px 0' : '80px 0 0 80px',
}));

const AuthWindow = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 1100, // slightly reduced for padding
  display: 'flex',
  borderRadius: 'var(--radius)',
  overflow: 'hidden',
  flexDirection: 'row',
  backgroundColor: 'hsl(var(--card))',
  boxShadow: 'var(--shadow-lg)',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const SidePanel = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'relative',
  backgroundImage: `url('/assets/bgimage.png')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: '2rem', // decreased padding
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom right, hsl(var(--primary) / 0.75), hsl(var(--accent) / 0.5))',
    backdropFilter: 'var(--glass-blur)',
    borderRadius: 'var(--radius)',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: 180,
    padding: '1rem',
    backgroundPosition: 'top',
  },
}));

const SideContent = styled(Box)({
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
  color: 'hsl(var(--primary-foreground))',
});

const FormPanel = styled(Box)({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem', // reduced padding
});

const FormCard = styled(Paper)({
  width: '100%',
  maxWidth: 380, // slightly smaller for sleekness
  padding: '1.5rem', // reduced padding
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  transition: 'all var(--transition-smooth)',
});

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Root>
      <Glow side="left" />
      <Glow side="right" />

      <AuthWindow>
        {!isMobile && (
          <SidePanel>
            <SideContent>
              <Box
                component="img"
                src="/assets/dark_logo.png"
                alt="Logo"
                sx={{ width: 150, height: 150, mb: 1.5 }}
              />
              <Typography variant="h5" fontWeight="bold">
                Reputation DAO
              </Typography>
              <Typography mt={0.5} fontSize={14} sx={{ color: 'hsl(var(--primary-foreground))', opacity: 0.85 }}>
                Secure, modern, and community-driven
              </Typography>
            </SideContent>
          </SidePanel>
        )}

        <FormPanel>
          <FormCard>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              {isSignUp ? 'Sign Up' : 'Login'}
            </Typography>

            <Box component="form" mt={1.5}>
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Name"
                  variant="outlined"
                  margin="dense"
                  InputProps={{
                    sx: {
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'hsl(var(--input))',
                      color: 'hsl(var(--foreground))',
                      transition: 'all var(--transition-fast)',
                      '&:hover': { backgroundColor: 'hsl(var(--secondary))' },
                    },
                  }}
                />
              )}
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="dense"
                InputProps={{
                  sx: {
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'hsl(var(--input))',
                    color: 'hsl(var(--foreground))',
                    '& input': { color: 'hsl(var(--foreground))' },
                    transition: 'all var(--transition-fast)',
                    '&:hover': { backgroundColor: 'hsl(var(--secondary))' },
                  },
                }}
                InputLabelProps={{ sx: { color: 'hsl(var(--muted-foreground))' } }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="dense"
                InputProps={{
                  sx: {
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'hsl(var(--input))',
                    color: 'hsl(var(--foreground))',
                    '& input': { color: 'hsl(var(--foreground))' },
                    transition: 'all var(--transition-fast)',
                    '&:hover': { backgroundColor: 'hsl(var(--secondary))' },
                  },
                }}
                InputLabelProps={{ sx: { color: 'hsl(var(--muted-foreground))' } }}
              />

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 'var(--radius)',
                  textTransform: 'none',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-lg)',
                  transition: 'all var(--transition-fast)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    backgroundColor: 'hsl(var(--primary))',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  },
                }}
              >
                {isSignUp ? 'Create Account' : 'Login'}
              </Button>

              <Divider sx={{ my: 2, borderColor: 'hsl(var(--border))' }}>or</Divider>

              <Stack spacing={1}>
                <Button
                  component={MuiLink}

                  href="/org-selector" // Update this to your desired route

                  variant="outlined"
                  startIcon={<CreditCard />}
                  fullWidth
                  sx={{
                    borderRadius: 'var(--radius)',
                    textTransform: 'none',
                    color: 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                    fontWeight: 500,
                    transition: 'all var(--transition-fast)',
                    '&:hover': {
                      borderColor: 'hsl(var(--foreground))',
                      backgroundColor: 'hsl(var(--secondary))',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Connect with Plug
                </Button>
              </Stack>

              <Typography mt={2} fontSize={13} textAlign="center" color="hsl(var(--muted-foreground))">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <Button
                  variant="text"
                  onClick={() => setIsSignUp(!isSignUp)}
                  sx={{
                    ml: 1,
                    textTransform: 'none',
                    color: 'hsl(var(--primary))',
                    fontWeight: 'bold',
                    transition: 'color var(--transition-fast)',
                    '&:hover': { color: 'hsl(var(--accent-foreground))' },
                  }}
                >
                  {isSignUp ? 'Login' : 'Sign Up'}
                </Button>
              </Typography>
            </Box>
          </FormCard>
        </FormPanel>
      </AuthWindow>
    </Root>
  );
}
