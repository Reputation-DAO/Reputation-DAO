import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import { PersonAdd, AdminPanelSettings } from "@mui/icons-material";

interface InviteAwarderCardProps {
  newAwarderPrincipal: string;
  setNewAwarderPrincipal: (value: string) => void;
  newAwarderName: string;
  setNewAwarderName: (value: string) => void;
  handleAddAwarder: (e: React.FormEvent) => void;
  isLoading: boolean;
  bgColor?: string;
  borderColor?: string;
}

const InviteAwarderCard: React.FC<InviteAwarderCardProps> = ({
  newAwarderPrincipal,
  setNewAwarderPrincipal,
  newAwarderName,
  setNewAwarderName,
  handleAddAwarder,
  isLoading,
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
        <Typography
          variant="subtitle2"
          sx={{
            mb: 3,
            color: "hsl(var(--foreground))",
            fontWeight: 600,
            letterSpacing: 0.3,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PersonAdd sx={{ color: "hsl(var(--primary))" }} /> Invite New Awarder
        </Typography>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleAddAwarder}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            label="Principal ID"
            value={newAwarderPrincipal}
            onChange={(e) => setNewAwarderPrincipal(e.target.value)}
            placeholder="e.g. rdmx6-jaaaa-aaaah-qcaiq-cai"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AdminPanelSettings sx={{ color: "hsl(var(--muted-foreground))" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "hsl(var(--background))",
                "& fieldset": { borderColor: "hsl(var(--border))" },
                "&:hover fieldset": { borderColor: "hsl(var(--primary))" },
                "&.Mui-focused fieldset": { borderColor: "hsl(var(--primary))" },
              },
              "& .MuiInputLabel-root": { color: "hsl(var(--muted-foreground))" },
              "& .MuiInputBase-input": { color: "hsl(var(--foreground))" },
            }}
          />

          <TextField
            fullWidth
            label="Awarder Name"
            value={newAwarderName}
            onChange={(e) => setNewAwarderName(e.target.value)}
            placeholder="Enter display name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonAdd sx={{ color: "hsl(var(--muted-foreground))" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "hsl(var(--background))",
                "& fieldset": { borderColor: "hsl(var(--border))" },
                "&:hover fieldset": { borderColor: "hsl(var(--primary))" },
                "&.Mui-focused fieldset": { borderColor: "hsl(var(--primary))" },
              },
              "& .MuiInputLabel-root": { color: "hsl(var(--muted-foreground))" },
              "& .MuiInputBase-input": { color: "hsl(var(--foreground))" },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={<PersonAdd />}
            sx={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              px: 4,
              py: 1.5,
              borderRadius: "var(--radius)",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              "&:hover": { backgroundColor: "hsl(var(--accent))" },
              "&:disabled": {
                backgroundColor: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              },
            }}
          >
            {isLoading ? "Adding..." : "Add Trusted Awarder"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InviteAwarderCard;
