import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          AffordMed Notifications
        </Typography>
        <Box gap={2} display="flex">
          <Button component={Link} to="/" sx={{ color: 'white' }}>
            All
          </Button>
          <Button component={Link} to="/priority" sx={{ color: 'white' }}>
            Priority Inbox
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}