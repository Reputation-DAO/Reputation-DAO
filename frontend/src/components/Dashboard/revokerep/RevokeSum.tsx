import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
} from "@mui/material";
import { TrendingDown } from "@mui/icons-material";

interface RevocationSummaryProps {
  totalRevocations: number;
  totalPointsRevoked: number;
}

const RevocationSummary: React.FC<RevocationSummaryProps> = ({
  totalRevocations,
  totalPointsRevoked,
}) => {
  return (
    <Box sx={{ width: { xs: "100%", lg: "300px" } }}>
      <Card
        sx={{
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
          boxShadow: `
            4px 4px 10px hsl(var(--muted) / 0.4), 
            -4px -4px 10px hsl(var(--muted) / 0.1)
          `,
          transition: "var(--transition-smooth)",
          "&:hover": {
            boxShadow: `
              6px 6px 14px hsl(var(--primary) / 0.5),
              -6px -6px 14px hsl(var(--primary) / 0.2)
            `,
          },
          mb: 4,
          mt: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <TrendingDown sx={{ color: "hsl(var(--destructive))" }} />
            <Typography
              variant="subtitle2"
              sx={{
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: 0.3,
              }}
            >
              Revocation Summary
            </Typography>
          </Box>

          {/* Stats */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                p: 2,
                backgroundColor: "hsl(var(--muted))",
                borderRadius: "var(--radius)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "hsl(var(--muted-foreground))" }}
              >
                Total Revocations
              </Typography>
              <Typography
                sx={{
                  color: "hsl(var(--destructive))",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {totalRevocations}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                p: 2,
                backgroundColor: "hsl(var(--muted))",
                borderRadius: "var(--radius)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "hsl(var(--muted-foreground))" }}
              >
                Total REP Revoked
              </Typography>
              <Typography
                sx={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {totalPointsRevoked} REP
              </Typography>
            </Box>
          </Box>

          {/* Info Alert */}
          <Alert
            severity="error"
            sx={{
              mt: 2,
              backgroundColor: "rgba(244, 67, 54, 0.1)",
              border: "1px solid rgba(244, 67, 54, 0.2)",
              borderRadius: "var(--radius)",
              "& .MuiAlert-message": {
                color: "hsl(var(--foreground))",
                fontSize: "0.8rem",
              },
            }}
          >
            <Typography variant="body2">
              All revocations are logged and require administrative approval.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RevocationSummary;
