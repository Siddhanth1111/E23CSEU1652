import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { useNotifications } from '../context/NotificationContext';
import type { Notification } from '../context/NotificationContext';

const typeColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  Event: "info",
  Result: "success",
  Placement: "warning"
};

export default function NotificationCard({ notification }: { notification: Notification }) {
  const { readIds, markAsRead } = useNotifications();
  const isRead = readIds.has(notification.ID);

  return (
    <Card 
      sx={{ 
        mb: 2, 
        bgcolor: isRead ? 'background.paper' : '#f0f7ff',
        borderLeft: isRead ? '4px solid transparent' : '4px solid #1976d2',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip 
            label={notification.Type} 
            color={typeColors[notification.Type] || "default"} 
            size="small" 
          />
          <Typography variant="caption" color="text.secondary">
            {new Date(notification.Timestamp).toLocaleString()}
          </Typography>
        </Box>
        <Typography 
          variant="body1" 
          sx={{ mt: 1, mb: 2, fontWeight: isRead ? 'normal' : 'bold' }}
        >
          {notification.Message}
        </Typography>
        {!isRead && (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => markAsRead(notification.ID)}
          >
            Mark as Read
          </Button>
        )}
      </CardContent>
    </Card>
  );
}