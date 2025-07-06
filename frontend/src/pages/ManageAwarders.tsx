import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const dummyAwarders = [
  { id: 'aaaa-bbbb-cccc', name: 'Alice' },
  { id: 'dddd-eeee-ffff', name: 'Eve' },
];

const ManageAwarders: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 6, sm: 8 },
        transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 500,
          mx: 'auto',
          mt: { xs: 4, md: 6 },
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, hsla(var(--primary), 0.2), hsla(var(--muted), 0.9))',
          color: 'hsl(var(--foreground))',
          border: 'var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              width: 64,
              height: 64,
            }}
          >
            <GroupIcon fontSize="large" />
          </Avatar>

          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ color: 'hsl(var(--foreground))' }}
          >
            Manage Awarders
          </Typography>

          <List sx={{ width: '100%' }}>
            {dummyAwarders.map((awarder) => (
              <React.Fragment key={awarder.id}>
                <ListItem
                  secondaryAction={
                    <Button
                      startIcon={<PersonRemoveIcon />}
                      sx={{
                        color: 'hsl(var(--destructive))',
                        '&:hover': {
                          color: 'hsl(var(--destructive-foreground))',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Remove
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <PersonAddIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={awarder.name}
                    secondary={awarder.id}
                    primaryTypographyProps={{ sx: { color: 'hsl(var(--foreground))' } }}
                    secondaryTypographyProps={{ sx: { color: 'hsl(var(--muted-foreground))' } }}
                  />
                </ListItem>
                <Divider
                  sx={{ backgroundColor: 'hsl(var(--border))', my: 0.5 }}
                />
              </React.Fragment>
            ))}
          </List>

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              '&:hover': {
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))',
              },
            }}
          >
            Add Awarder
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ManageAwarders;
