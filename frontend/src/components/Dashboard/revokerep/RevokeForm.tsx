import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { Warning, Person, RemoveCircle } from "@mui/icons-material";

interface RevokeReputationCardProps {
  recipient: string;
  setRecipient: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  isLoading: boolean;
  handleRevokeSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  bgColor?: string;
  borderColor?: string;
}

export default function RevokeReputationCard({
  recipient,
  setRecipient,
  amount,
  setAmount,
  category,
  setCategory,
  reason,
  setReason,
  isLoading,
  handleRevokeSubmit,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}: RevokeReputationCardProps) {
  return (
    <Box sx={{ flex: 1 }}>
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
          mt: 4,
          mb: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: "hsl(var(--foreground))",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Warning sx={{ color: "hsl(var(--destructive))" }} />
            Revoke Reputation Points
          </Typography>

          {/* Warning Banner */}
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              backgroundColor: "rgba(255, 152, 0, 0.1)",
              border: "1px solid rgba(255, 152, 0, 0.2)",
              "& .MuiAlert-message": {
                color: "hsl(var(--foreground))",
              },
            }}
          >
            <Typography variant="body2">
              <strong>Warning:</strong> Revoking reputation points is a serious
              action that cannot be easily undone. Please ensure you have valid
              reasons and proper authorization.
            </Typography>
          </Alert>

          {/* Form */}
          <Box component="form" onSubmit={handleRevokeSubmit}>
            {/* Recipient + Amount */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                mb: 3,
              }}
            >
              <TextField
                fullWidth
                label="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Principal ID (e.g. rdmx6-jaaaa-aaaah-qcaiq-cai)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "hsl(var(--muted-foreground))" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "hsl(var(--background))",
                    "& fieldset": {
                      borderColor: "hsl(var(--border))",
                    },
                    "&:hover fieldset": {
                      borderColor: "hsl(var(--primary))",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "hsl(var(--primary))",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "hsl(var(--muted-foreground))",
                  },
                  "& .MuiInputBase-input": {
                    color: "hsl(var(--foreground))",
                  },
                }}
              />

              <TextField
                fullWidth
                label="Reputation Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to revoke"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RemoveCircle
                        sx={{ color: "hsl(var(--muted-foreground))" }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "hsl(var(--background))",
                    "& fieldset": {
                      borderColor: "hsl(var(--border))",
                    },
                    "&:hover fieldset": {
                      borderColor: "hsl(var(--primary))",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "hsl(var(--primary))",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "hsl(var(--muted-foreground))",
                  },
                  "& .MuiInputBase-input": {
                    color: "hsl(var(--foreground))",
                  },
                }}
              />
            </Box>

            {/* Category */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: "hsl(var(--muted-foreground))" }}>
                Revocation Category
              </InputLabel>
              <Select
                value={category}
                label="Revocation Category"
                onChange={(e) => setCategory(e.target.value)}
                sx={{
                  backgroundColor: "hsl(var(--background))",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "hsl(var(--border))",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "hsl(var(--primary))",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "hsl(var(--primary))",
                  },
                  "& .MuiSelect-select": {
                    color: "hsl(var(--foreground))",
                  },
                }}
              >
                <MenuItem value="policy_violation">Policy Violation</MenuItem>
                <MenuItem value="spam">Spam Activity</MenuItem>
                <MenuItem value="fraud">Fraudulent Behavior</MenuItem>
                <MenuItem value="misconduct">Misconduct</MenuItem>
                <MenuItem value="inactive">Inactivity</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Reason */}
            <TextField
              fullWidth
              label="Reason for Revocation"
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide detailed explanation for this revocation action"
              required
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "hsl(var(--background))",
                  "& fieldset": {
                    borderColor: "hsl(var(--border))",
                  },
                  "&:hover fieldset": {
                    borderColor: "hsl(var(--primary))",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "hsl(var(--primary))",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "hsl(var(--muted-foreground))",
                },
                "& .MuiInputBase-input": {
                  color: "hsl(var(--foreground))",
                },
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={<RemoveCircle />}
              sx={{
                backgroundColor: "hsl(var(--destructive))",
                color: "hsl(var(--destructive-foreground))",
                px: 4,
                py: 1.5,
                borderRadius: "var(--radius)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                "&:hover": {
                  backgroundColor: "hsl(var(--destructive) / 0.9)",
                },
                "&:disabled": {
                  backgroundColor: "hsl(var(--muted))",
                },
              }}
            >
              {isLoading ? "Revoking..." : "Revoke Reputation"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
