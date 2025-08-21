import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { History, Info, Undo } from "@mui/icons-material";

interface Revocation {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

interface RecentRevocationsTableProps {
  recentRevocations: Revocation[];
  getStatusColor: (
    status: Revocation["status"]
  ) => "default" | "success" | "error" | "warning" | "info";
  bgColor?: string;
  borderColor?: string;
}

const RecentRevocationsTable: React.FC<RecentRevocationsTableProps> = ({
  recentRevocations,
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
            alignItems: "center",
            gap: 1,
            mb: 3,
          }}
        >
          <History sx={{ color: "hsl(var(--destructive))" }} />
          <Typography
            variant="subtitle2"
            sx={{
              color: "hsl(var(--muted-foreground))",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Recent Revocations
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "hsl(var(--background))",
            boxShadow: "none",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "hsl(var(--card))" }}>
                {[
                  "Recipient",
                  "Amount",
                  "Reason",
                  "Date",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      color: "hsl(var(--foreground))",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderBottom: "1px solid hsl(var(--border))",
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRevocations.map((revocation) => (
                <TableRow
                  key={revocation.id}
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
                    {revocation.recipient}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "hsl(var(--destructive))",
                      fontWeight: 600,
                      borderBottom: "1px solid hsl(var(--border))",
                    }}
                  >
                    -{revocation.amount} REP
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "hsl(var(--muted-foreground))",
                      borderBottom: "1px solid hsl(var(--border))",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: "0.8rem",
                    }}
                  >
                    {revocation.reason}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "hsl(var(--muted-foreground))",
                      borderBottom: "1px solid hsl(var(--border))",
                      fontSize: "0.8rem",
                    }}
                  >
                    {revocation.date}
                  </TableCell>
                  <TableCell
                    sx={{ borderBottom: "1px solid hsl(var(--border))" }}
                  >
                    <Chip
                      label={revocation.status}
                      color={getStatusColor(revocation.status)}
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                        fontSize: "0.7rem",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{ borderBottom: "1px solid hsl(var(--border))" }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          sx={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          <Info />
                        </IconButton>
                      </Tooltip>
                      {revocation.status === "pending" && (
                        <Tooltip title="Undo Revocation">
                          <IconButton
                            size="small"
                            sx={{ color: "hsl(var(--destructive))" }}
                          >
                            <Undo />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty state */}
              {recentRevocations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography
                      sx={{
                        color: "hsl(var(--muted-foreground))",
                        fontSize: "0.85rem",
                      }}
                    >
                      No revocations yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RecentRevocationsTable;
