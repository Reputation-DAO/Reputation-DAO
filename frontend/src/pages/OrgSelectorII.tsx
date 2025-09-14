// src/pages/OrgSelectorII.tsx - Internet Identity version
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
import { getInternetIdentityActor, getInternetIdentityPrincipal } from "../components/canister/reputationDao";

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
  fontWeight: 600,
  padding: "12px 24px",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "var(--shadow-lg)",
  },
}));

interface Organization {
  name: string;
  description: string;
  awardersCount: number;
  membersCount: number;
}

const OrgSelectorII: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserPrincipal, setCurrentUserPrincipal] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
    fetchCurrentPrincipal();
  }, []);

  const fetchCurrentPrincipal = async () => {
    try {
      console.log("🔍 Fetching current principal for Internet Identity user...");
      const principal = await getInternetIdentityPrincipal();
      setCurrentUserPrincipal(principal.toString());
      console.log("✅ Current principal:", principal.toString());
    } catch (error) {
      console.error("❌ Error fetching principal:", error);
      setError("Failed to get user identity. Please try logging in again.");
    }
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("📋 Fetching organizations for Internet Identity user...");
      const actor = await getInternetIdentityActor();
      
      const orgNames = await actor.getAllOrgs();
      console.log("📋 Organization names:", orgNames);

      const orgDetails = await Promise.all(
        orgNames.map(async (name: string) => {
          try {
            const stats = await actor.getOrgStats(name);
            if (stats && stats.length > 0) {
              const orgStat = stats[0];
              const awarders = await actor.getOrgTrustedAwarders(name);
              
              return {
                name,
                description: `Admin: ${orgStat?.admin?.toString().slice(0, 8) || 'Unknown'}...`, // Using admin as description
                awardersCount: awarders && awarders.length > 0 && awarders[0] ? awarders[0].length : 0,
                membersCount: orgStat ? Number(orgStat.userCount) : 0,
              };
            }
            return null;
          } catch (error) {
            console.error(`❌ Error fetching details for org ${name}:`, error);
            return null;
          }
        })
      );

      const validOrgs = orgDetails.filter((org: Organization | null): org is Organization => org !== null);
      setOrganizations(validOrgs);
      console.log("✅ Organizations loaded:", validOrgs);

    } catch (error: any) {
      console.error("❌ Error fetching organizations:", error);
      setError("Failed to load organizations. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      console.log("🏢 Creating organization:", newOrgName);
      const actor = await getInternetIdentityActor();
      
      const result = await actor.registerOrg(newOrgName.trim());
      console.log("✅ Organization creation result:", result);

      // Refresh the organizations list
      await fetchOrganizations();

      // Clear form
      setNewOrgName("");
      setNewOrgDescription("");

      alert(`Organization "${newOrgName}" created successfully!`);
    } catch (error: any) {
      console.error("❌ Error creating organization:", error);
      setError(error.message || "Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinOrganization = async (orgName: string) => {
    try {
      console.log(`🤝 Selecting organization: ${orgName}`);
      
      // For Internet Identity users, we directly navigate to dashboard
      // The organization selection is implicit - user interacts with the org they select
      navigate(`/dashboard?org=${encodeURIComponent(orgName)}&auth=ii`);
    } catch (error: any) {
      console.error("❌ Error selecting organization:", error);
      setError(error.message || `Failed to select ${orgName}`);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="hsl(var(--muted))"
      >
        <SelectorCard>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Loading organizations...</Typography>
          </Box>
        </SelectorCard>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="hsl(var(--muted))"
      p={2}
    >
      <SelectorCard>
        <Typography variant="h4" align="center" gutterBottom>
          🆔 Select Organization
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
          Internet Identity User: {currentUserPrincipal ? `${currentUserPrincipal.slice(0, 8)}...` : "Loading..."}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Existing Organizations */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Join Existing Organization
        </Typography>

        {organizations.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No organizations available. Create one below!
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            {organizations.map((org) => (
              <Paper
                key={org.name}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="h6">{org.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {org.description || "No description"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {org.membersCount} members • {org.awardersCount} awarders
                    </Typography>
                  </Box>
                  <ActionButton
                    variant="contained"
                    onClick={() => handleJoinOrganization(org.name)}
                    sx={{ ml: 2 }}
                  >
                    Join
                  </ActionButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Create New Organization */}
        <Typography variant="h6" gutterBottom>
          Create New Organization
        </Typography>

        <TextField
          fullWidth
          label="Organization Name"
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          sx={{ mb: 2 }}
          disabled={isCreating}
        />

        <TextField
          fullWidth
          label="Description (Optional)"
          value={newOrgDescription}
          onChange={(e) => setNewOrgDescription(e.target.value)}
          multiline
          rows={3}
          sx={{ mb: 3 }}
          disabled={isCreating}
        />

        <ActionButton
          fullWidth
          variant="contained"
          onClick={handleCreateOrganization}
          disabled={isCreating || !newOrgName.trim()}
        >
          {isCreating ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Creating...
            </>
          ) : (
            "Create Organization"
          )}
        </ActionButton>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            variant="text"
            onClick={() => navigate("/auth")}
            sx={{ color: "hsl(var(--muted-foreground))" }}
          >
            ← Back to Login
          </Button>
        </Box>
      </SelectorCard>
    </Box>
  );
};

export default OrgSelectorII;
