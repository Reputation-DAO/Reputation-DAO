import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';

interface UserBalanceSearchCardProps {
  fetchBalance: (principal: string) => Promise<number>;
  bgColor?: string;
  borderColor?: string;
}

const UserBalanceSearchCard: React.FC<UserBalanceSearchCardProps> = ({
  fetchBalance,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setSelectedBalance(null);
    try {
      const balance = await fetchBalance(searchTerm.trim());
      setSelectedBalance(balance);
    } catch (error) {
      console.error('Search error:', error);
      setSelectedBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

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
          variant="h6"
          sx={{
            mb: 3,
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Search sx={{ color: 'hsl(var(--primary))' }} />
          Search User Balance
        </Typography>

        {/* Search Input & Button */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 3 }}>
          <TextField
            fullWidth
            label="Enter Address or Username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. rdmx6-jaaaa-aaaah-qcaiq-cai"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'hsl(var(--muted-foreground))' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'hsl(var(--card))',
                borderRadius: "var(--radius)",
                '& fieldset': { borderColor: 'hsl(var(--border))' },
                '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
              },
              '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
              '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
            }}
          />

          <Button
            variant="contained"
            disabled={isLoading}
            onClick={handleSearch}
            startIcon={isLoading ? <CircularProgress size={16} /> : <Search />}
            sx={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              px: 3,
              py: 1.5,
              borderRadius: "var(--radius)",
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 120,
              '&:hover': { backgroundColor: 'hsl(var(--primary))/90' },
              '&:disabled': { backgroundColor: 'hsl(var(--muted))' },
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        {/* Balance Display */}
        {selectedBalance !== null && (
          <Box
            sx={{
              mt: 2,
              p: 3,
              backgroundColor: 'hsl(var(--muted))',
              borderRadius: "var(--radius)",
              border: `1px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h3" sx={{ color: 'hsl(var(--primary))', fontWeight: 700 }}>
              {selectedBalance}
            </Typography>
            <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))' }}>
              Reputation Points
            </Typography>
            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
              for {searchTerm}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UserBalanceSearchCard;
