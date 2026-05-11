import { useNotifications } from '../context/NotificationContext';
import NotificationCard from '../components/NotificationCard';
import { Typography, CircularProgress, Box } from '@mui/material';

export default function AllNotifications() {
  const { notifications, loading } = useNotifications();

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>All Notifications</Typography>
      {notifications.map(n => (
        <NotificationCard key={n.ID} notification={n} />
      ))}
    </Box>
  );
}