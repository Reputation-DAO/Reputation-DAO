// src/pages/OrgSelector.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { getPlugActor, getCurrentPrincipal } from "../components/canister/reputationDao";



const SelectorCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 560,
  padding: theme.spacing(4),
  borderRadius: "var(--radius)",
  backgroundColor: "hsl(var(--background))",
  boxShadow: "var(--shadow-lg)",
}));

const ActionButton = styled(Button)(() => ({
  borderRadius: "var(--radius)",
  textTransform: "none",
  padding: "0.6rem 1.1rem",
  fontWeight: 600,
  boxShadow: "var(--shadow-md)",
}));

const OrgSelector: React.FC = () => {
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const navigate = useNavigate();

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Check wallet connection + retrieve principal (tries helper first, falls back to window.ic.plug)
  const checkWalletConnection = async () => {
    try {
      if (window.ic?.plug) {
        const connected = await window.ic.plug.isConnected();
        setIsConnected(Boolean(connected));

        if (connected) {
          // Prefer helper that may normalize principal retrieval
          let principal: any = null;
          try {
            principal = await getCurrentPrincipal();
          } catch {
            /* ignore and fallback */
          }

          if (!principal && window.ic?.plug?.getPrincipal) {
            principal = await window.ic.plug.getPrincipal();
          }

          setUserPrincipal(principal ? principal.toString() : null);
          return;
        }
      }
    } catch (err) {
      console.warn("Error checking wallet connection:", err);
    }

    setIsConnected(false);
    setUserPrincipal(null);
  };

  useEffect(() => {
    checkWalletConnection();
    // we intentionally do not add navigate/getPlugActor to deps
    // to keep the mount-check simple and stable
  }, []);

  const handleDisconnect = async () => {
    try {
      if (window.ic?.plug?.disconnect) {
        await window.ic.plug.disconnect();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setIsConnected(false);
      setUserPrincipal(null);
      navigate("/auth");
    }
  };

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    clearMessages();

    try {
      const actor = await getPlugActor();
      if (!actor) {
        setError("Failed to connect wallet. Please make sure Plug is installed and unlocked.");
        return;
      }

      // After getPlugActor returns, re-check to fetch principal
      await checkWalletConnection();
      setSuccess("Wallet connected");
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err?.message || "Failed to connect wallet. Please make sure Plug is installed.");
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleRegisterOrg = async () => {
    if (!orgId.trim()) {
      setError("Please enter an Organization ID");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const reputationDao = await getPlugActor();
      if (!reputationDao) {
        setError("Failed to connect to canister");
        return;
      }

      const trimmed = orgId.trim();
      const result = await reputationDao.registerOrg(trimmed);

      // Keep compatibility with the canister's response pattern:
      // many Motoko bindings return strings, others return objects.
      if (typeof result === "string") {
        if (result.toLowerCase().includes("success")) {
          setSuccess(`Organization "${trimmed}" registered successfully! You are the admin.`);
        } else {
          setError(result);
          return;
        }
      } else if (result && (result.ok || result.success)) {
        // handle ad-hoc success shapes
        setSuccess(`Organization "${trimmed}" registered successfully! You are the admin.`);
      } else {
        setError("Unexpected response from canister while registering organization");
        return;
      }

      // store and notify
      localStorage.setItem("selectedOrgId", trimmed);
      localStorage.setItem("userRole", "Admin");
      window.dispatchEvent(new CustomEvent("orgChanged"));

      // navigate after a tiny pause so user sees message
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      console.error("Register org error:", err);
      setError(err?.message || "Failed to register organization");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!orgId.trim()) {
      setError("Please enter an Organization ID");
      return;
    }

    if (!userPrincipal) {
      setError("No principal available. Connect your wallet first.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const reputationDao = await getPlugActor();
      if (!reputationDao) {
        setError("Failed to connect to canister");
        return;
      }

      const trimmed = orgId.trim();
      // Check admin presence (handle Motoko optional/nullable patterns)
      const adminResult: any = await reputationDao.getOrgAdmin(trimmed);
      if (!adminResult || (Array.isArray(adminResult) && adminResult.length === 0)) {
        setError("Organization not found. Please check the Organization ID.");
        return;
      }

      const adminPrincipal = Array.isArray(adminResult) ? adminResult[0] : adminResult;
      let userRole = "RegularUser";

      if (adminPrincipal && adminPrincipal.toString() === userPrincipal) {
        userRole = "Admin";
      } else {
        // attempt to fetch trusted awarders (handle optional wrapping)
        try {
          const trustedAwardersRaw: any = await reputationDao.getTrustedAwarders(trimmed);
          if (trustedAwardersRaw && Array.isArray(trustedAwardersRaw) && trustedAwardersRaw.length) {
            const awardersList = trustedAwardersRaw[0];
            if (Array.isArray(awardersList)) {
              const isAwarder = awardersList.some((awarder: any) => {
                // awarder may be an object or direct principal; support both
                if (!awarder) return false;
                if (awarder.id) return awarder.id.toString() === userPrincipal;
                return awarder.toString() === userPrincipal;
              });
              if (isAwarder) userRole = "TrustedAwarder";
            }
          }
        } catch (awarderErr) {
          console.warn("Could not fetch trusted awarders:", awarderErr);
        }
      }

      setSuccess(`Successfully joined organization "${trimmed}" as ${userRole}`);
      localStorage.setItem("selectedOrgId", trimmed);
      localStorage.setItem("userRole", userRole);
      window.dispatchEvent(new CustomEvent("orgChanged"));

      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      console.error("Join org error:", err);
      setError(err?.message || "Failed to join organization");
    } finally {
      setLoading(false);
    }
  };

  // If wallet not connected, show connect UI
  if (!isConnected || !userPrincipal) {
    return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2, // small padding for mobile
      }}
    >
        <SelectorCard>
          <Box display="flex" flexDirection="column" alignItems="center" p={2}>
            <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: "hsl(var(--primary))" }}>
              Connect Your Wallet
            </Typography>

            <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", mb: 3, textAlign: "center" }}>
              Please connect your Plug wallet to select or create an organization.
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  width: "100%",
                  backgroundColor: "hsl(var(--destructive))",
                  color: "hsl(var(--destructive-foreground))",
                  borderRadius: "var(--radius)",
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  width: "100%",
                  backgroundColor: "hsl(var(--success))",
                  color: "hsl(var(--success-foreground))",
                  borderRadius: "var(--radius)",
                }}
              >
                {success}
              </Alert>
            )}

            <ActionButton
              variant="contained"
              onClick={handleConnectWallet}
              disabled={connectingWallet}
              startIcon={connectingWallet ? <CircularProgress size={18} /> : undefined}
              sx={{
                minWidth: 220,
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                "&:hover": { opacity: 0.95 },
                "&.Mui-disabled": { opacity: 0.6 },
              }}
            >
              {connectingWallet ? "Connecting..." : "Connect Plug Wallet"}
            </ActionButton>

            <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", mt: 2, textAlign: "center" }}>
              Don't have Plug wallet?{" "}
              <Button
                variant="text"
                size="small"
                onClick={() => window.open("https://plugwallet.ooo/", "_blank")}
                sx={{ textTransform: "none", color: "hsl(var(--primary))" }}
              >
                Download here
              </Button>
            </Typography>
          </Box>
        </SelectorCard>
    </Box>
    );
  }

  // Connected UI
  return (
     <Box
  sx={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: 2,
    backgroundColor: "hsl(var(--background))",
  }}
>
  <SelectorCard
    sx={{
      p: 4,
      backgroundColor: "hsl(var(--card))",
      color: "hsl(var(--foreground))",
    }}
  >
    {/* Header */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h5" fontWeight={700} sx={{ color: "hsl(var(--primary))", letterSpacing: "0.35px" }}>
        Select Organization
      </Typography>

      <Button
        variant="outlined"
        size="small"
        onClick={handleDisconnect}
        sx={{
          borderColor: "hsl(var(--primary))",
          color: "hsl(var(--primary))",
          fontWeight: 600,
          borderRadius: "var(--radius)",
          textTransform: "none",
          boxShadow: "var(--shadow-md)",
          "&:hover": { backgroundColor: "hsl(var(--muted))" },
        }}
      >
        Disconnect
      </Button>
    </Box>

    {/* Connected Principal */}
    <Box mb={3}>
      <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", mb: 1, fontWeight: 600 }}>
        Connected Principal:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          wordBreak: "break-all",
          backgroundColor: "hsl(var(--secondary))",
          color: "hsl(var(--foreground))",
          p: 1.2,
          borderRadius: "var(--radius)",
          fontSize: "0.8rem",
          border: "1px solid hsl(var(--border))",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {userPrincipal}
      </Typography>
    </Box>

    <Divider sx={{ mb: 3, borderColor: "hsl(var(--border))" }} />

    {/* Alerts */}
    {error && (
      <Alert
        severity="error"
        sx={{
          mb: 3,
          backgroundColor: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
          borderRadius: "var(--radius)",
          fontWeight: 600,
          boxShadow: "var(--shadow-md)",
        }}
      >
        {error}
      </Alert>
    )}

    {success && (
      <Alert
        severity="success"
        sx={{
          mb: 3,
          backgroundColor: "hsl(var(--success))",
          color: "hsl(var(--success-foreground))",
          borderRadius: "var(--radius)",
          fontWeight: 600,
          boxShadow: "var(--shadow-md)",
        }}
      >
        {success}
      </Alert>
    )}

    {/* Form */}
    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleRegisterOrg(); }}>
      <TextField
  fullWidth
  label="Organization ID"
  variant="outlined"
  value={orgId}
  onChange={(e) => setOrgId(e.target.value)}
  placeholder="Enter organization identifier (e.g., my-company)"
  disabled={loading}
  sx={{
    mb: 3,
    "& .MuiOutlinedInput-root": {
      borderRadius: "var(--radius)",
      backgroundColor: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      "& input::placeholder": {
        color: "hsl(var(--muted-foreground))",
        opacity: 1,
      },

      // Autofill fix
      "& input:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 1000px hsl(var(--background)) inset",
        WebkitTextFillColor: "hsl(var(--foreground))",
        transition: "background-color 5000s ease-in-out 0s",
      },

      // Border handling
      "& fieldset": {
        borderColor: "hsl(var(--muted-foreground))", // default border
      },
      "&:hover fieldset": {
        borderColor: "hsl(var(--primary))", // on hover
      },
      "&.Mui-focused fieldset": {
        borderColor: "hsl(var(--primary))", // on focus
        borderWidth: "2px", // optional, looks stronger
      },
    },
    "& .MuiInputLabel-root": {
      color: "hsl(var(--muted-foreground))",
      "&.Mui-focused": { color: "hsl(var(--primary))" },
    },
  }}
/>


      {/* Action buttons */}
      <Box display="flex" gap={2} mb={3}>
        <ActionButton
          variant="contained"
          fullWidth
          onClick={handleRegisterOrg}
          disabled={loading || !orgId.trim()}
          sx={{
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            "&:hover": { opacity: 0.95 },
            "&.Mui-disabled": { opacity: 0.6 },
          }}
        >
          {loading ? <CircularProgress size={20} /> : "Register Org"}
        </ActionButton>

        <ActionButton
          variant="outlined"
          fullWidth
          onClick={handleJoinOrg}
          disabled={loading || !orgId.trim()}
          sx={{
            borderColor: "hsl(var(--primary))",
            color: "hsl(var(--primary))",
            "&:hover": { backgroundColor: "hsl(var(--muted))" },
            "&.Mui-disabled": { opacity: 0.6 },
          }}
        >
          {loading ? <CircularProgress size={20} /> : "Join Org"}
        </ActionButton>
      </Box>

      {/* Info */}
      <Box>
        <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", mb: 1.25, lineHeight: 1.6 }}>
          <strong style={{ color: "hsl(var(--primary))" }}>Register Org:</strong> Create a new organization (you become admin)
        </Typography>
        <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
          <strong style={{ color: "hsl(var(--primary))" }}>Join Org:</strong> Join an existing organization
        </Typography>
      </Box>
    </Box>
  </SelectorCard>
</Box>

  );
};

export default OrgSelector;
