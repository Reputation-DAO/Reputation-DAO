import React from 'react';
import { Box, Paper, Stack, Typography, Button, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider } from '@mui/material';
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
        minHeight: 'calc(100vh - 64px)',
        marginLeft: '410px',
        marginTop: '85px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'transparent',
        pt: 6,
      }}
    >
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 500 }}>
        <Stack spacing={3} alignItems="center">
          <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <GroupIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={600} color="secondary.main">
            Manage Awarders
          </Typography>
          <List sx={{ width: '100%' }}>
            {dummyAwarders.map((awarder) => (
              <React.Fragment key={awarder.id}>
                <ListItem
                  secondaryAction={
                    <Button color="error" startIcon={<PersonRemoveIcon />}>Remove</Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonAddIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={awarder.name} secondary={awarder.id} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          <Button variant="contained" color="primary" startIcon={<PersonAddIcon />}>Add Awarder</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ManageAwarders;
