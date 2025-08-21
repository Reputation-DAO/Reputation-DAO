// components/SearchCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search } from "@mui/icons-material";

interface SearchCardProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  bgColor?: string;
  borderColor?: string;
}

const SearchCard: React.FC<SearchCardProps> = ({
  searchTerm,
  setSearchTerm,
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
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "hsl(var(--foreground))",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Search Awarders
          </Typography>
        </Box>

        {/* Search Input */}
        <TextField
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or principal ID"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "hsl(var(--muted-foreground))" }} />
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
            "& .MuiInputBase-input": { color: "hsl(var(--foreground))" },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default SearchCard;
