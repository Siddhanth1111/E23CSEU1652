# Stage 1

### Core Actions 
1. **Fetch Notifications:** Retrieve a list of notifications for the active user.
2. **Get Unread Count:** Fetch the total number of unread notifications for UI badges.
3. **Mark as Read:** Update a specific notification's status to 'read'.

### REST API Design & Contracts

1. Fetch Notifications
Endpoint: GET /api/v1/notifications

Description: Retrieves notifications (mapping to the evaluation server structure).

{
  "notifications": [
    {
      "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "Type": "Result",
      "Message": "mid-sem",
      "Timestamp": "2026-04-22 17:51:30",
      "IsRead": false 
    },
    {
      "ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
      "Type": "Placement",
      "Message": "CSX Corporation hiring",
      "Timestamp": "2026-04-22 17:51:18",
      "IsRead": true
    }
  ]
}

2. Get Unread Count
Endpoint: GET /api/v1/notifications/unread-count

Description : Unread notifications count

Response : 
{
  "count": 4
}

3. Mark Notification as Read
Endpoint: PATCH /api/v1/notifications/:id/read

Description : marking notification from unread to read

Response:
{
  "success": true,
  "message": "Notification marked as read."
}




**Common Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}