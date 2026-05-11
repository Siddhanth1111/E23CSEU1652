import { Log } from 'logging-middleware';
import { AffordMedNotification, NotificationResponse } from '../types';

const EVALUATION_API_URL = "http://4.224.186.213/evaluation-service/notifications";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJlMjNjc2V1MTY1MkBiZW5uZXR0LmVkdS5pbiIsImV4cCI6MTc3ODQ4Nzc3OCwiaWF0IjoxNzc4NDg2ODc4LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNjZmOWYxNjctOGMxNS00Y2U0LTg0MmYtZDE2ZWYzNjIyMDg1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic2lkZGhhbnRoIGNoYXVoYW4iLCJzdWIiOiI4NzhkOGJiNS1jMjdlLTQ4MDMtOWNmNS1kMzRhYzFlN2NjM2EifSwiZW1haWwiOiJlMjNjc2V1MTY1MkBiZW5uZXR0LmVkdS5pbiIsIm5hbWUiOiJzaWRkaGFudGggY2hhdWhhbiIsInJvbGxObyI6ImUyM2NzZXUxNjUyIiwiYWNjZXNzQ29kZSI6IlRmRHhnciIsImNsaWVudElEIjoiODc4ZDhiYjUtYzI3ZS00ODAzLTljZjUtZDM0YWMxZTdjYzNhIiwiY2xpZW50U2VjcmV0IjoibkVZa1pwQ1NZbk5uaFZCdCJ9.WPs0LBVx--DTEVQuRJWkOyLNfwZoWx0f0z-3Oj3O3Qo";


const readNotifications = new Set<string>();

const PRIORITY_WEIGHTS: Record<string, number> = {
  "Placement": 3,
  "Result": 2,
  "Event": 1,
};

export const fetchAndSortNotifications = async (): Promise<AffordMedNotification[]> => {
  try {
    Log("backend", "info", "service", "Fetching notifications from evaluation API");
    
    const response = await fetch(EVALUATION_API_URL, {
      headers: {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = (await response.json()) as NotificationResponse;
    const notifications = data.notifications || [];

    // Sort based on Stage 6 Priority Logic
    notifications.sort((a, b) => {
      const weightA = PRIORITY_WEIGHTS[a.Type] || 0;
      const weightB = PRIORITY_WEIGHTS[b.Type] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    });

    Log("backend", "info", "service", `Successfully fetched and sorted ${notifications.length} notifications`);
    return notifications;

  } catch (error: any) {
    Log("backend", "error", "service", `Failed to fetch notifications: ${error.message}`);
    throw error;
  }
};

export const getUnreadCount = async (): Promise<number> => {
  const allNotifications = await fetchAndSortNotifications();
  const unread = allNotifications.filter(n => !readNotifications.has(n.ID));
  return unread.length;
};

export const markAsRead = (id: string): void => {
  readNotifications.add(id);
  Log("backend", "info", "service", `Notification ${id} marked as read`);
};