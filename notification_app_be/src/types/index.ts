export interface AffordMedNotification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

export interface NotificationResponse {
  notifications: AffordMedNotification[];
}