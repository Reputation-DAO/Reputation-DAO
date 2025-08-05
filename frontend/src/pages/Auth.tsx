
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Paper,
} from '@mui/material';
import { Google, CreditCard } from '@mui/icons-material';
import { styled } from '@mui/system';
import { Link as MuiLink } from '@mui/material';
import { useState } from "react";


const Root = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 96px)', // Adjusted height to prevent clipping with header/footer
  width: '100%',
  backgroundColor: 'hsl(var(--background))',
  padding: theme.spacing(6, 2),
}));

const AuthWindow = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 1200,
  display: 'flex',
  borderRadius: theme.spacing(2),
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  backdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border))',
  overflow: 'hidden',
  flexDirection: 'row',
}));

const SidePanel = styled(Box)(({ theme }) => ({
  flex: 1,
  backgroundImage: `url('/assets/bgimage.png')`, // Replace with your actual image
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'hsl(var(--primary-foreground))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(6),
}));


const FormPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  backgroundColor: 'hsl(var(--background))',
}));

const FormCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 400,
  padding: theme.spacing(4),
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  backgroundColor: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
}));

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <Root>
      <AuthWindow>

        <SidePanel>
          <Box
            component="img"
            src="/assets/dark_logo.png" // Replace with your logo path
            alt="Logo"
            sx={{
              width: 600,
              height: 600,
            }}
          />
          <br/>
          <Typography variant="h3" fontWeight="bold" color="black">
            Reputation DAO
          </Typography>

        </SidePanel>


        <FormPanel>
          <FormCard>
            <Typography variant="h5" fontWeight="600" gutterBottom>
              {isSignUp ? 'Sign Up' : 'Login'}
            </Typography>

            <Box component="form" mt={2}>
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Name"
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    sx: {
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'hsl(var(--input))',
                      color: 'hsl(var(--foreground))',
                    },
                  }}
                />
              )}
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                InputProps={{
                  sx: {
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'hsl(var(--input))',
                    color: 'hsl(var(--foreground))',
                    '& input': {
                      color: 'hsl(var(--foreground))',
                    },
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: 'hsl(var(--muted-foreground))',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                InputProps={{
                  sx: {
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'hsl(var(--input))',
                    color: 'hsl(var(--foreground))',
                    '& input': {
                      color: 'hsl(var(--foreground))',
                    },
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: 'hsl(var(--muted-foreground))',
                  },
                }}
              />


              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  py: 1.5,
                  borderRadius: 'var(--radius)',
                  textTransform: 'none',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  '&:hover': {
                    backgroundColor: 'hsl(var(--primary) / 0.9)',
                  },
                }}
              >
                {isSignUp ? 'Create Account' : 'Login'}
              </Button>

              <Divider sx={{ my: 3, borderColor: 'hsl(var(--border))' }}>or</Divider>

              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Google />}
                  fullWidth
                  sx={{
                    borderRadius: 'var(--radius)',
                    textTransform: 'none',
                    color: 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                  }}
                >
                  Connect with Google
                </Button>
                <Button
                  component={MuiLink}
                  href="/dashboard" // Update this to your desired route
                  variant="outlined"
                  startIcon={<CreditCard />}
                  fullWidth
                  sx={{
                    borderRadius: 'var(--radius)',
                    textTransform: 'none',
                    color: 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                    '&:hover': {
                      borderColor: 'hsl(var(--foreground))',
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  Connect with Plug
                </Button>
              </Box>

              <Typography mt={3} fontSize={14} textAlign="center" color="hsl(var(--muted-foreground))">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <Button
                  variant="text"
                  onClick={toggleMode}
                  sx={{
                    ml: 1,
                    textTransform: 'none',
                    color: 'hsl(var(--primary))',
                    fontWeight: 'bold',
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
};

export default AuthPage;