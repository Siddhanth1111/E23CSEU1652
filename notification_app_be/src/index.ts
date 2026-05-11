import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initLogger, Log } from 'logging-middleware';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

// Initialize Logger
const LOGGING_TOKEN = process.env.LOGGING_TOKEN || "YOUR_PROTECTED_ROUTE_TOKEN_HERE";
initLogger(LOGGING_TOKEN);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/v1/notifications', notificationRoutes);

app.listen(PORT, () => {
  Log("backend", "info", "handler", `Server initialized and listening on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});