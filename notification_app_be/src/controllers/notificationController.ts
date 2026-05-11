import { Request, Response } from 'express';
import { Log } from 'logging-middleware';
import * as notificationService from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    Log("backend", "info", "controller", "Processing getNotifications request");
    const limit = parseInt(req.query.limit as string) || 10; // Stage 6 priority inbox limit
    
    const notifications = await notificationService.fetchAndSortNotifications();
    const topNotifications = notifications.slice(0, limit);

    res.status(200).json({ success: true, data: topNotifications });
  } catch (error) {
    Log("backend", "error", "controller", "Error in getNotifications");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    Log("backend", "info", "controller", "Processing getUnreadCount request");
    const count = await notificationService.getUnreadCount();
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    Log("backend", "error", "controller", "Error in getUnreadCount");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markNotificationRead = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    Log("backend", "info", "controller", `Processing markNotificationRead for ID: ${id}`);
    
    notificationService.markAsRead(id);
    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    Log("backend", "error", "controller", "Error in markNotificationRead");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};