import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Remove as RevokeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useRole } from "../../contexts/RoleContext";
import {
  getOrgTransactionHistory,
  getTransactionsByUser,
  type Transaction,
  type TransactionType,
} from "../canister/reputationDao";

interface DecayTransactionFilterProps {
  className?: string;
  userId?: string;
  showOnlyDecay?: boolean;
}

const DecayTransactionFilter: React.FC<DecayTransactionFilterProps> = ({
  className,
  userId,
  showOnlyDecay = false,
}) => {
  const { currentPrincipal, isAdmin } = useRole();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "All">("All");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const storedOrgId = localStorage.getItem("selectedOrgId");
    if (storedOrgId) setOrgId(storedOrgId);
  }, []);

  useEffect(() => {
    if (orgId) fetchTransactions();
  }, [currentPrincipal, userId, orgId]);

  useEffect(() => {
    applyFilters();
  }, [transactions, typeFilter, dateRange, searchTerm, showOnlyDecay]);

  const fetchTransactions = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      let txs: Transaction[];
      if (userId && currentPrincipal) txs = await getTransactionsByUser(orgId, currentPrincipal);
      else if (isAdmin && orgId) txs = await getOrgTransactionHistory(orgId);
      else if (currentPrincipal) txs = await getTransactionsByUser(orgId, currentPrincipal);
      else txs = [];
      setTransactions(txs);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    if (showOnlyDecay) filtered = filtered.filter((tx) => tx.transactionType === "Decay");
    else if (typeFilter !== "All") filtered = filtered.filter((tx) => tx.transactionType === typeFilter);

    const now = Date.now() / 1000;
    const ranges = { day: 86400, week: 604800, month: 2592000 };
    if (dateRange !== "all" && ranges[dateRange as keyof typeof ranges]) {
      const cutoff = now - ranges[dateRange as keyof typeof ranges];
      filtered = filtered.filter((tx) => tx.timestamp >= cutoff);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.reason?.toLowerCase().includes(term) ||
          tx.amount.toString().includes(term)
      );
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    setFilteredTransactions(filtered);
  };

  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();
  const formatPrincipal = (p: any) =>
    `${p.toString().slice(0, 5)}...${p.toString().slice(-3)}`;

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "Award":
        return <TrendingUpIcon sx={{ color: "hsl(var(--success))" }} />;
      case "Revoke":
        return <RevokeIcon sx={{ color: "hsl(var(--destructive))" }} />;
      case "Decay":
        return <ScheduleIcon sx={{ color: "hsl(var(--warning))" }} />;
      default:
        return <TrendingDownIcon sx={{ color: "hsl(var(--muted-foreground))" }} />;
    }
  };


  const exportToCSV = () => {
    const csv = [
      ["Date", "Type", "From", "To", "Amount", "Reason"],
      ...filteredTransactions.map((tx) => [
        formatDate(tx.timestamp),
        tx.transactionType,
        formatPrincipal(tx.from),
        formatPrincipal(tx.to),
        tx.amount.toString(),
        tx.reason || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${showOnlyDecay ? "decay-" : ""}${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const decayCount = transactions.filter((tx) => tx.transactionType === "Decay").length;
  const totalDecayAmount = transactions
    .filter((tx) => tx.transactionType === "Decay")
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (!orgId)
    return (
      <Card
        className={className}
        sx={{
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
          p: 3,
          mb: 4,
        }}
      >
        <CardContent>
          <Alert severity="info" sx={{ color: "hsl(var(--foreground))" }}>
            Please select an organization to view transaction history.
          </Alert>
        </CardContent>
      </Card>
    );

  return (
    <Card
      className={className}
      sx={{
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-md)",
        transition: "var(--transition-smooth)",
        "&:hover": {
          boxShadow:
            "0 8px 20px hsl(var(--primary)/0.3), 0 4px 12px hsl(var(--primary)/0.15)",
        },
        mb: 4,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <TrendingDownIcon sx={{ color: "hsl(var(--foreground))" }} />
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ color: "hsl(var(--foreground))" }}
            >
              {showOnlyDecay ? "Decay History" : "Transaction History"}
            </Typography>
            {decayCount > 0 && (
              <Chip
                label={`${decayCount} decay events`}
                size="small"
                sx={{
                  borderColor: "hsl(var(--warning))",
                  color: "hsl(var(--foreground))",
                  backgroundColor: "hsl(var(--warning)/0.1)",
                }}
              />
            )}
          </Box>
        }
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Export to CSV">
              <IconButton size="small" onClick={exportToCSV}>
                <DownloadIcon sx={{ color: "hsl(var(--foreground))" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={fetchTransactions}>
                <RefreshIcon sx={{ color: "hsl(var(--foreground))" }} />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent sx={{ p: 3 }}>
        {!showOnlyDecay && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            {/** Type Filter **/}
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                "& .MuiInputLabel-root": { color: "hsl(var(--foreground))" },
                "& .MuiSelect-select": { color: "hsl(var(--foreground))" },
                "& .MuiMenuItem-root": { color: "hsl(var(--foreground))" },
                "& .MuiSvgIcon-root": { color: "hsl(var(--foreground))" },
              }}
            >
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as TransactionType | "All")
                }
                label="Type"
              >
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Award">Award</MenuItem>
                <MenuItem value="Revoke">Revoke</MenuItem>
                <MenuItem value="Decay">Decay</MenuItem>
              </Select>
            </FormControl>

            {/** Date Range Filter **/}
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                "& .MuiInputLabel-root": { color: "hsl(var(--foreground))" },
                "& .MuiSelect-select": { color: "hsl(var(--foreground))" },
                "& .MuiMenuItem-root": { color: "hsl(var(--foreground))" },
                "& .MuiSvgIcon-root": { color: "hsl(var(--foreground))" },
              }}
            >
              <InputLabel>Period</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Period"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="day">Last Day</MenuItem>
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
              </Select>
            </FormControl>

            {/** Search Box **/}
            <TextField
              size="small"
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Reason or amount"
              sx={{
                minWidth: 200,
                "& .MuiInputBase-input": { color: "hsl(var(--foreground))" },
                "& .MuiInputLabel-root": { color: "hsl(var(--foreground))" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "hsl(var(--border))",
                },
              }}
            />
          </Box>
        )}

        {decayCount > 0 && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              color: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--warning)/0.1)",
              borderColor: "hsl(var(--warning))",
            }}
          >
            Total {decayCount} decay events: {totalDecayAmount} points decayed
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2, background: "hsl(var(--muted))", "& .MuiLinearProgress-bar": { backgroundColor: "hsl(var(--primary))" } }} />}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, color: "hsl(var(--destructive-foreground))", backgroundColor: "hsl(var(--destructive)/0.1)" }}
          >
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: "hsl(var(--border))",background:"hsl(var(--background))" }}>
          <Table size="small">
            <TableHead sx={{ background: "hsl(var(--muted)/0.2)" }}>
              <TableRow>
                {["Date", "Type", "From", "To", "Amount", "Reason"].map((label) => (
                  <TableCell key={label} sx={{ color: "hsl(var(--foreground))" }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))" }}>
                      {loading ? "Loading..." : "No transactions found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ fontSize: "0.75rem", color: "hsl(var(--foreground))" }}>
                      {formatDate(tx.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {getTransactionIcon(tx.transactionType)}
                        <Chip
                          label={tx.transactionType}
                          size="small"
                          variant="outlined"
                          sx={{
                            color: "hsl(var(--foreground))",
                            borderColor:
                              tx.transactionType === "Award"
                                ? "hsl(var(--success))"
                                : tx.transactionType === "Decay"
                                ? "hsl(var(--warning))"
                                : "hsl(var(--destructive))",
                            backgroundColor:
                              tx.transactionType === "Award"
                                ? "hsl(var(--success)/0.1)"
                                : tx.transactionType === "Decay"
                                ? "hsl(var(--warning)/0.1)"
                                : "hsl(var(--destructive)/0.1)",
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "hsl(var(--foreground))" }}>
                      {formatPrincipal(tx.from)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "hsl(var(--foreground))" }}>
                      {formatPrincipal(tx.to)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: "bold",
                        color:
                          tx.transactionType === "Award"
                            ? "hsl(var(--success))"
                            : tx.transactionType === "Decay"
                            ? "hsl(var(--warning))"
                            : "hsl(var(--destructive))",
                      }}
                    >
                      {tx.transactionType === "Award" ? "+" : "-"}
                      {tx.amount}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", color: "hsl(var(--foreground))" }}>
                      {tx.reason || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredTransactions.length > 0 && (
          <Typography
            variant="caption"
            sx={{ mt: 1, display: "block", color: "hsl(var(--muted-foreground))" }}
          >
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DecayTransactionFilter;
