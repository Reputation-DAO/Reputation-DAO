import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { Send, Person, Star, EmojiEvents } from "@mui/icons-material";

interface AwardReputationFormProps {
  recipient: string;
  setRecipient: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  isLoading: boolean;
  handleAwardSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const AwardReputationForm: React.FC<AwardReputationFormProps> = ({
  recipient,
  setRecipient,
  amount,
  setAmount,
  category,
  setCategory,
  reason,
  setReason,
  isLoading,
  handleAwardSubmit,
}) => {
  return (
    <Box sx={{ flex: 1 }}>
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
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Typography
            variant="subtitle2"
            sx={{
              mb: 3,
              color: "hsl(var(--muted-foreground))",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: 0.3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Send sx={{ color: "hsl(var(--primary))" }} />
            Award Reputation Points
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={handleAwardSubmit}>
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
                placeholder="Enter ICP address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person
                        sx={{ color: "hsl(var(--muted-foreground))" }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "hsl(var(--background))",
                    borderRadius: "var(--radius)",
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
                placeholder="Enter amount"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Star sx={{ color: "hsl(var(--muted-foreground))" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "hsl(var(--background))",
                    borderRadius: "var(--radius)",
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
                Category
              </InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                sx={{
                  backgroundColor: "hsl(var(--background))",
                  borderRadius: "var(--radius)",
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
                <MenuItem value="development">Development</MenuItem>
                <MenuItem value="community">Community</MenuItem>
                <MenuItem value="governance">Governance</MenuItem>
                <MenuItem value="documentation">Documentation</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Reason */}
            <TextField
              fullWidth
              label="Reason for Award"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this person deserves reputation points"
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "hsl(var(--background))",
                  borderRadius: "var(--radius)",
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

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={<EmojiEvents />}
              sx={{
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                px: 4,
                py: 1.5,
                borderRadius: "var(--radius)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: `
                  2px 2px 6px hsl(var(--muted) / 0.5),
                  -2px -2px 6px hsl(var(--muted) / 0.2)
                `,
                "&:hover": {
                  backgroundColor: "hsl(var(--primary))",
                  boxShadow: `
                    3px 3px 8px hsl(var(--primary) / 0.6),
                    -3px -3px 8px hsl(var(--primary) / 0.3)
                  `,
                },
                "&:disabled": {
                  backgroundColor: "hsl(var(--muted))",
                },
              }}
            >
              {isLoading ? "Awarding..." : "Award Reputation"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AwardReputationForm;
