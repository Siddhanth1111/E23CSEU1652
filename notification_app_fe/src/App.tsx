import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline } from '@mui/material';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import AllNotifications from './pages/AllNotifications';
import PriorityInbox from './pages/PriorityInbox';

export default function App() {
  return (
    <NotificationProvider>
      <CssBaseline /> {/* Standardizes MUI styles across browsers */}
      <Router>
        <Navbar />
        <Container maxWidth="md">
          <Routes>
            <Route path="/" element={<AllNotifications />} />
            <Route path="/priority" element={<PriorityInbox />} />
          </Routes>
        </Container>
      </Router>
    </NotificationProvider>
  );
}