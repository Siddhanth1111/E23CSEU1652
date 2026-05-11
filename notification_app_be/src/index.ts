import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initLogger, Log } from 'logging-middleware';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

// Initialize Logger
const LOGGING_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJlMjNjc2V1MTY1MkBiZW5uZXR0LmVkdS5pbiIsImV4cCI6MTc3ODQ4Nzc3OCwiaWF0IjoxNzc4NDg2ODc4LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNjZmOWYxNjctOGMxNS00Y2U0LTg0MmYtZDE2ZWYzNjIyMDg1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic2lkZGhhbnRoIGNoYXVoYW4iLCJzdWIiOiI4NzhkOGJiNS1jMjdlLTQ4MDMtOWNmNS1kMzRhYzFlN2NjM2EifSwiZW1haWwiOiJlMjNjc2V1MTY1MkBiZW5uZXR0LmVkdS5pbiIsIm5hbWUiOiJzaWRkaGFudGggY2hhdWhhbiIsInJvbGxObyI6ImUyM2NzZXUxNjUyIiwiYWNjZXNzQ29kZSI6IlRmRHhnciIsImNsaWVudElEIjoiODc4ZDhiYjUtYzI3ZS00ODAzLTljZjUtZDM0YWMxZTdjYzNhIiwiY2xpZW50U2VjcmV0IjoibkVZa1pwQ1NZbk5uaFZCdCJ9.WPs0LBVx--DTEVQuRJWkOyLNfwZoWx0f0z-3Oj3O3Qo";
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