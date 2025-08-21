// components/StatsCard.tsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { AdminPanelSettings, Refresh } from "@mui/icons-material";

interface StatsCardProps {
  awarders: { status: string }[];
  handleRefresh: () => void;
  refreshing: boolean;
  bgColor?: string;
  borderColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  awarders,
  handleRefresh,
  refreshing,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  const stats = [
    { label: "Total Awarders", value: awarders.length },
    { label: "Active", value: awarders.filter((a) => a.status === "active").length },
    { label: "Inactive", value: awarders.filter((a) => a.status === "inactive").length },
  ];

  return (
    <Box sx={{ width: { xs: "100%", lg: "300px" } }}>
      <Card
        sx={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
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
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AdminPanelSettings sx={{ color: "hsl(var(--primary))" }} />
              <Typography
                variant="subtitle2"
                sx={{
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                Statistics
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                color: "hsl(var(--muted-foreground))",
                "&:hover": { color: "hsl(var(--primary))" },
              }}
            >
              {refreshing ? <CircularProgress size={16} /> : <Refresh />}
            </IconButton>
          </Box>

          {/* Stats */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {stats.map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  backgroundColor: "hsl(var(--muted))",
                  borderRadius: "var(--radius)",
                  border: `1px solid ${borderColor}`,
                  transition: "var(--transition-smooth)",
                  "&:hover": {
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--primary))",
                  },
                }}
              >
                <Typography
                  sx={{
                    color: "hsl(var(--muted-foreground))",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  sx={{
                    color: "hsl(var(--primary))",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatsCard;
