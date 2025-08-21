// components/AwardersCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Avatar,
  Chip,
} from "@mui/material";
import { Group, Refresh, MoreVert } from "@mui/icons-material";

interface Awarder {
  id: string;
  name: string;
  principal: string;
  status: string;
  totalAwarded: number;
}

interface AwardersCardProps {
  filteredAwarders: Awarder[];
  refreshing: boolean;
  handleRefresh: () => void;
  handleMenuClick: (e: React.MouseEvent<HTMLButtonElement>, awarder: Awarder) => void;
  getStatusColor: (status: string) => string;
  bgColor?: string;
  borderColor?: string;
}

const AwardersCard: React.FC<AwardersCardProps> = ({
  filteredAwarders,
  refreshing,
  handleRefresh,
  handleMenuClick,
  getStatusColor,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  return (
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
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "hsl(var(--muted-foreground))",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            <Group sx={{ color: "hsl(var(--primary))" }} /> Awarders ({filteredAwarders.length})
          </Typography>

          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              color: "hsl(var(--primary))",
              border: `1px solid ${borderColor}`,
              "&:hover": {
                borderColor: "hsl(var(--primary))",
                backgroundColor: "hsl(var(--muted))",
              },
            }}
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Loading */}
        {refreshing ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "hsl(var(--primary))" }} />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: bgColor,
              boxShadow: "none",
              border: `1px solid ${borderColor}`,
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "hsl(var(--muted))" }}>
                  {["Awarder", "Principal ID", "Status", "Total Awarded", "Actions"].map(
                    (header) => (
                      <TableCell
                        key={header}
                        sx={{
                          color: "hsl(var(--foreground))",
                          fontWeight: 600,
                          borderBottom: `1px solid ${borderColor}`,
                          fontSize: "0.875rem",
                        }}
                      >
                        {header}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredAwarders.map((awarder) => (
                  <TableRow
                    key={awarder.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "hsl(var(--muted))",
                      },
                    }}
                  >
                    {/* Awarder */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}` }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            backgroundColor: "hsl(var(--primary))",
                            color: "hsl(var(--primary-foreground))",
                            width: 32,
                            height: 32,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {awarder.name.charAt(0)}
                        </Avatar>
                        <Typography
                          sx={{
                            color: "hsl(var(--foreground))",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                          }}
                        >
                          {awarder.name}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Principal ID */}
                    <TableCell
                      sx={{
                        borderBottom: `1px solid ${borderColor}`,
                        color: "hsl(var(--muted-foreground))",
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {awarder.principal}
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}` }}>
                      <Chip
                        label={awarder.status}
                        color={getStatusColor(awarder.status) as any}
                        size="small"
                        sx={{ textTransform: "capitalize", fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    {/* Total Awarded */}
                    <TableCell
                      sx={{
                        borderBottom: `1px solid ${borderColor}`,
                        color: "hsl(var(--primary))",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                      }}
                    >
                      {awarder.totalAwarded} REP
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}` }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, awarder)}
                        sx={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AwardersCard;
