import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  NewReleases as NewReleasesIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useRole } from "../../contexts/RoleContext";
import {
  getBalanceWithDetails,
  getDecayConfig,
  calculateDaysUntilDecay,
  isInGracePeriod,
  getDecayStatus,
  type DecayConfig,
  type BalanceWithDetails,
} from "../canister/reputationDao";

interface DecayStatusCardProps {
  className?: string;
  bgColor?: string;
  borderColor?: string;
}

const DecayStatusCard: React.FC<DecayStatusCardProps> = ({
  className,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  const { currentPrincipal } = useRole();
  const [balanceDetails, setBalanceDetails] =
    useState<BalanceWithDetails | null>(null);
  const [decayConfig, setDecayConfig] = useState<DecayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentPrincipal) fetchDecayData();
  }, [currentPrincipal]);

  const fetchDecayData = async () => {
    if (!currentPrincipal) return;
    setLoading(true);
    setError(null);
    try {
      const [details, config] = await Promise.all([
        getBalanceWithDetails(currentPrincipal),
        getDecayConfig(),
      ]);
      setBalanceDetails(details);
      setDecayConfig(config);
    } catch (err) {
      console.error("Error fetching decay data:", err);
      setError("Failed to fetch decay information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "success";
      case "grace":
        return "info";
      case "at-risk":
        return "warning";
      case "decaying":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <CheckCircleIcon color="success" />;
      case "grace":
        return <NewReleasesIcon color="info" />;
      case "at-risk":
        return <WarningIcon color="warning" />;
      case "decaying":
        return <ScheduleIcon color="error" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "safe":
        return "Safe from Decay";
      case "grace":
        return "Grace Period";
      case "at-risk":
        return "Decay Soon";
      case "decaying":
        return "Decay Pending";
      default:
        return "Unknown";
    }
  };

  const formatTimeRemaining = (days: number) => {
    if (days <= 0) return "Decay available now";
    if (days === 1) return "1 day remaining";
    return `${days} days remaining`;
  };

  const getDecayProgress = (daysUntilDecay: number, intervalDays: number) => {
    if (intervalDays === 0) return 0;
    return Math.max(
      0,
      Math.min(100, ((intervalDays - daysUntilDecay) / intervalDays) * 100)
    );
  };

  if (loading) {
    return (
      <Card
        className={className}
        sx={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ScheduleIcon color="disabled" />
            <Typography variant="h6" color="hsl(var(--foreground))">
              Loading decay status...
            </Typography>
          </Box>
          <LinearProgress
            sx={{ mt: 2, height: 8, borderRadius: "var(--radius)" }}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !balanceDetails || !decayConfig) {
    return (
      <Card
        className={className}
        sx={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {error ? <WarningIcon color="error" /> : <InfoIcon color="disabled" />}
            <Typography
              variant="h6"
              color={error ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
            >
              {error ?? "No decay information available"}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const status = getDecayStatus(
    balanceDetails.currentBalance,
    balanceDetails.decayInfo || null,
    decayConfig
  );
  const daysUntilDecay = balanceDetails.decayInfo
    ? calculateDaysUntilDecay(balanceDetails.decayInfo, decayConfig)
    : 0;
  const intervalDays = Math.floor(decayConfig.decayInterval / 86400);
  const progress = getDecayProgress(daysUntilDecay, intervalDays);

  return (
    <Card
      className={className}
      sx={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-lg)",
        transition: "var(--transition-smooth)",
        "&:hover": {
          boxShadow:
            "0 8px 20px hsl(var(--primary)/0.4), 0 4px 12px hsl(var(--primary)/0.2)",
        },
        mb: 4,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {getStatusIcon(status)}
            <Typography
              variant="h6"
              fontWeight={600}
              color="hsl(var(--foreground))"
            >
              Point Decay Status
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status) as any}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 500,
              color: "hsl(var(--foreground))",
              borderColor: "hsl(var(--muted-foreground)/0.4)",
            }}
          />
        </Box>

        {/* Status Overview */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            color="hsl(var(--foreground))"
            gutterBottom
          >
            Current Balance:{" "}
            <strong>{balanceDetails.currentBalance}</strong>
            {balanceDetails.pendingDecay > 0 && (
              <Tooltip title={`${balanceDetails.pendingDecay} points will decay`}>
                <Chip
                  label={`-${balanceDetails.pendingDecay}`}
                  size="small"
                  color="warning"
                  sx={{ ml: 1, fontWeight: 600 }}
                />
              </Tooltip>
            )}
          </Typography>
          {decayConfig.enabled && balanceDetails.decayInfo && (
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic" }}
              color="hsl(var(--muted-foreground))"
            >
              {formatTimeRemaining(daysUntilDecay)}
            </Typography>
          )}
        </Box>

        {/* Progress Bar */}
        {decayConfig.enabled && status !== "safe" && status !== "grace" && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={status === "at-risk" ? "warning" : "error"}
              sx={{ height: 10, borderRadius: "var(--radius)" }}
            />
            <Typography
              variant="caption"
              color="hsl(var(--muted-foreground))"
              sx={{ mt: 0.75, display: "block" }}
            >
              Progress to next decay
            </Typography>
          </Box>
        )}

        {/* Expand/Collapse */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              color: "hsl(var(--primary))",
              "&:hover": { color: "hsl(var(--primary-foreground))" },
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "hsl(var(--secondary))",
              borderRadius: "var(--radius)",
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              color="hsl(var(--foreground))"
              fontWeight={600}
            >
              Decay Details
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                fontSize: "0.875rem",
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="hsl(var(--muted-foreground))"
                >
                  Raw Balance
                </Typography>
                <Typography variant="body2" color="hsl(var(--foreground))">
                  {balanceDetails.rawBalance}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="hsl(var(--muted-foreground))"
                >
                  Pending Decay
                </Typography>
                <Typography
                  variant="body2"
                  color={
                    balanceDetails.pendingDecay > 0
                      ? "hsl(var(--warning))"
                      : "hsl(var(--foreground))"
                  }
                  fontWeight={600}
                >
                  {balanceDetails.pendingDecay}
                </Typography>
              </Box>
              {balanceDetails.decayInfo && (
                <>
                  <Box>
                    <Typography
                      variant="caption"
                      color="hsl(var(--muted-foreground))"
                    >
                      Total Decayed
                    </Typography>
                    <Typography variant="body2" color="hsl(var(--foreground))">
                      {balanceDetails.decayInfo.totalDecayed}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="hsl(var(--muted-foreground))"
                    >
                      Registration
                    </Typography>
                    <Typography variant="body2" color="hsl(var(--foreground))">
                      {new Date(
                        balanceDetails.decayInfo.registrationTime * 1000
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="hsl(var(--muted-foreground))"
                    >
                      Last Decay
                    </Typography>
                    <Typography variant="body2" color="hsl(var(--foreground))">
                      {new Date(
                        balanceDetails.decayInfo.lastDecayTime * 1000
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="hsl(var(--muted-foreground))"
                    >
                      Last Activity
                    </Typography>
                    <Typography variant="body2" color="hsl(var(--foreground))">
                      {new Date(
                        balanceDetails.decayInfo.lastActivityTime * 1000
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Config Info */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: "hsl(var(--muted))",
                borderRadius: "var(--radius)",
              }}
            >
              <Typography
                variant="caption"
                color="hsl(var(--muted-foreground))"
              >
                System Configuration
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: "0.8rem" }}
                color="hsl(var(--foreground))"
              >
                {decayConfig.decayRate / 100}% every {intervalDays} days, min{" "}
                {decayConfig.minThreshold} points
              </Typography>
              {balanceDetails.decayInfo &&
                isInGracePeriod(balanceDetails.decayInfo, decayConfig) && (
                  <Typography
                    variant="body2"
                    color="hsl(var(--info))"
                    sx={{ fontSize: "0.8rem", fontWeight: 500 }}
                  >
                    You're in the grace period - no decay for new users!
                  </Typography>
                )}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default DecayStatusCard;
