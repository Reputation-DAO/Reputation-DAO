import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Button,
} from "@mui/material";
import { History, Info } from "@mui/icons-material";

interface Award {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

interface RecentAwardsTableProps {
  recentAwards: Award[];
  loadingAwards: boolean;
  getStatusColor: (status: string) => "default" | "primary" | "success" | "warning" | "error";
  bgColor?: string;
  borderColor?: string;
}

const RecentAwardsTable: React.FC<RecentAwardsTableProps> = ({
  recentAwards,
  loadingAwards,
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
    mt: 4,  // ⬅️ added margin-top
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
              color: "hsl(var(--muted-foreground))",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: 0.3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <History sx={{ color: "hsl(var(--primary))" }} />
            Recent Awards
          </Typography>

          <Button
            variant="outlined"
            size="small"
            sx={{
              color: "hsl(var(--primary))",
              borderColor: "hsl(var(--border))",
              fontSize: "0.75rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "var(--radius)",
              "&:hover": {
                borderColor: "hsl(var(--primary))",
                backgroundColor: "hsl(var(--muted))",
              },
            }}
          >
            View all
          </Button>
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "hsl(var(--muted))",
            boxShadow: "none",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "hsl(var(--card))" }}>
                {["Recipient", "Amount", "Reason", "Date", "Status", "Actions"].map(
                  (header) => (
                    <TableCell
                      key={header}
                      sx={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 600,
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                    >
                      {header}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingAwards ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography sx={{ mt: 1, color: "hsl(var(--muted-foreground))" }}>
                      Loading recent awards...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : recentAwards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                    <Typography sx={{ color: "hsl(var(--muted-foreground))" }}>
                      No recent awards found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentAwards.map((award) => (
                  <TableRow
                    key={award.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "hsl(var(--card))",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        color: "hsl(var(--foreground))",
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                    >
                      {award.recipient}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "hsl(var(--primary))",
                        fontWeight: 600,
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                    >
                      {award.amount} REP
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "hsl(var(--muted-foreground))",
                        borderBottom: "1px solid hsl(var(--border))",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {award.reason}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "hsl(var(--muted-foreground))",
                        borderBottom: "1px solid hsl(var(--border))",
                      }}
                    >
                      {award.date}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      <Chip
                        label={award.status}
                        color={getStatusColor(award.status)}
                        size="small"
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          sx={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RecentAwardsTable;
