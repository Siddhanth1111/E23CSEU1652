import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initLogger, Log } from 'logging-middleware';

export interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  priorityNotifications: Notification[];
  readIds: Set<string>;
  markAsRead: (id: string) => void;
  loading: boolean;
  setPriorityLimit: (limit: number) => void;
  setPriorityFilter: (type: string) => void;
  priorityLimit: number;
  priorityFilter: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const PRIORITY_WEIGHTS: Record<string, number> = {
  "Placement": 3,
  "Result": 2,
  "Event": 1,
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Priority Inbox States
  const [priorityLimit, setPriorityLimit] = useState(10);
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    // Initialize logging middleware
    initLogger("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJlMjNjc2V1MTY1MkBiZW5uZXR0LmVkdS5pbiIsImV4cCI6MTc3ODQ4Nzc3OCwiaWF0IjoxNzc4NDg2ODc4LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNjZmOWYxNjctOGMxNS00Y2U0LTg0MmYtZDE2ZWYzNjIyMDg1IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoic2lkZGhhbnRoIGNoYXVoYW4iLCJzdWIiOiI4NzhkOGJiNS1jMjdlLTQ4MDMtOWNmNS1kMzRhYzFlN2NjM2EifSwiZW1haWwiOiJlMjNjc2V1MTY1MkBiZW5uZXR0LmVkdS5pbiIsIm5hbWUiOiJzaWRkaGFudGggY2hhdWhhbiIsInJvbGxObyI6ImUyM2NzZXUxNjUyIiwiYWNjZXNzQ29kZSI6IlRmRHhnciIsImNsaWVudElEIjoiODc4ZDhiYjUtYzI3ZS00ODAzLTljZjUtZDM0YWMxZTdjYzNhIiwiY2xpZW50U2VjcmV0IjoibkVZa1pwQ1NZbk5uaFZCdCJ9.WPs0LBVx--DTEVQuRJWkOyLNfwZoWx0f0z-3Oj3O3Qo");
    
    // Load read state from local storage
    const storedRead = localStorage.getItem('readNotifications');
    if (storedRead) setReadIds(new Set(JSON.parse(storedRead)));

    const fetchNotifications = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/v1/notifications");
        const json = await response.json();
        setNotifications(json.data || []);
        Log("frontend", "info", "api", "Successfully fetched notifications");
      } catch (error: any) {
        Log("frontend", "error", "api", `Fetch failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const newSet = new Set(prev).add(id);
      localStorage.setItem('readNotifications', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    Log("frontend", "info", "state", `Marked notification ${id} as read`);
  };

  // Derive Priority Notifications based on Stage 6 logic
  const priorityNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    if (priorityFilter !== "All") {
      filtered = filtered.filter(n => n.Type === priorityFilter);
    }

    return filtered.sort((a, b) => {
      const weightA = PRIORITY_WEIGHTS[a.Type] || 0;
      const weightB = PRIORITY_WEIGHTS[b.Type] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    }).slice(0, priorityLimit);
  }, [notifications, priorityLimit, priorityFilter]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      priorityNotifications,
      readIds, 
      markAsRead, 
      loading,
      setPriorityLimit,
      setPriorityFilter,
      priorityLimit,
      priorityFilter
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
};