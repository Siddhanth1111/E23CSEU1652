import { Log } from 'logging-middleware';
import { AffordMedNotification, NotificationResponse } from '../types';

const EVALUATION_API_URL = "http://4.224.186.213/evaluation-service/notifications";
const AUTH_TOKEN = process.env.EVALUATION_API_TOKEN || "YOUR_TOKEN_HERE";

// In-memory store for 'read' states since DB is not allowed
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