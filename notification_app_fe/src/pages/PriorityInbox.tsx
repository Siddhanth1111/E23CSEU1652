import { useNotifications } from '../context/NotificationContext';
import NotificationCard from '../components/NotificationCard';
import { Typography, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';

export default function PriorityInbox() {
  const { 
    priorityNotifications, 
    loading, 
    priorityLimit, 
    setPriorityLimit, 
    priorityFilter, 
    setPriorityFilter 
  } = useNotifications();

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Priority Inbox</Typography>
      
      <Box display="flex" gap={2} mb={4}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Top N</InputLabel>
          <Select 
            value={priorityLimit} 
            label="Top N" 
            onChange={(e) => setPriorityLimit(Number(e.target.value))}
          >
            <MenuItem value={5}>Top 5</MenuItem>
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type Filter</InputLabel>
          <Select 
            value={priorityFilter} 
            label="Type Filter" 
            onChange={(e) => setPriorityFilter(e.target.value as string)}
          >
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {priorityNotifications.map(n => (
        <NotificationCard key={n.ID} notification={n} />
      ))}
    </Box>
  );
}