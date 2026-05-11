Stage 1
Core Features
Fetch notifications for the logged-in user
Get unread notification count for badge display
Mark notifications as read
API Design
1. Fetch Notifications

Endpoint: GET /api/v1/notifications

Returns the user’s notifications.

{
  "notifications": [
    {
      "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "Type": "Result",
      "Message": "mid-sem",
      "Timestamp": "2026-04-22 17:51:30",
      "IsRead": false
    }
  ]
}
2. Get Unread Count

Endpoint: GET /api/v1/notifications/unread-count

{
  "count": 4
}
3. Mark Notification as Read

Endpoint: PATCH /api/v1/notifications/:id/read

{
  "success": true,
  "message": "Notification marked as read."
}
Common Headers
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
Stage 2
Database Choice

I would use PostgreSQL with Prisma ORM.

PostgreSQL gives strong consistency and handles relational data well. It also supports JSONB, which is useful for storing flexible notification metadata without changing the schema frequently.

Prisma Schema
model Notification {
  id          String   @id @default(uuid())
  userId      String
  externalId  String   @unique
  type        String
  message     String
  timestamp   DateTime @default(now())
  isRead      Boolean  @default(false)

  @@index([userId, isRead, timestamp(sort: Desc)])
}
Scaling Challenges & Fixes
1. Huge Notification Volume

As notifications grow into millions of rows, queries become slower.

Solution:
Use PostgreSQL partitioning (monthly partitions) and archive old data after 30–60 days.

2. Expensive Unread Count Queries

Running COUNT(*) repeatedly puts unnecessary load on the DB.

Solution:
Cache unread counts in Redis and update them whenever notifications are created or marked as read.

3. Mass Notification Broadcasts

Sending notifications to all students at once can overload the database.

Solution:
Use a queue system like RabbitMQ or AWS SQS and process inserts in batches using createMany.

Queries
Fetch Notifications
await prisma.notification.findMany({
  where: { userId: currentUserId },
  orderBy: { timestamp: 'desc' },
  take: 50
});
Get Unread Count
await prisma.notification.count({
  where: {
    userId: currentUserId,
    isRead: false
  }
});
Mark as Read
await prisma.notification.update({
  where: { externalId: notificationId },
  data: { isRead: true }
});




Stage 3
Query Analysis

The query works syntactically, but from a product perspective it has issues:

ORDER BY createdAt ASC shows the oldest notifications first
No LIMIT clause means huge payloads for users with many notifications
Why It’s Slow
No proper index → full table scan
Sorting large datasets is expensive
SELECT * fetches unnecessary data
Improved Query
SELECT id, notificationType, message, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt DESC
LIMIT 20;
Recommended Index
CREATE INDEX idx_student_unread_recent
ON notifications (studentID, isRead, createdAt DESC);
Performance Impact
Before: O(N) full table scan
After: O(log N) index lookup
Should We Index Every Column?

No.

Notifications are write-heavy systems. Too many indexes slow down inserts and updates because every index must also be updated. Indexes should only be added for commonly used filters and sorting conditions.

Placement Notifications in Last 7 Days
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';




Stage 4
Improving Read Performance
1. Cache Unread Counts

Store unread counts in Redis.

Example:

unread_count:student:1042

This avoids hitting PostgreSQL for every page load.

2. Use WebSockets Instead of Polling

Maintain a persistent socket connection after login.

New notifications are pushed directly to the frontend instead of repeatedly fetching them from the server.

3. Pagination

Fetch notifications in small batches (10–20 at a time) using cursor-based pagination.

This reduces unnecessary data transfer.




Stage 5
Problems in the Existing Design
Sequential processing is too slow
One failure can crash the whole loop
No retry mechanism
External email APIs can rate-limit requests
Email success + DB failure creates inconsistent state
Better Architecture

I would redesign this using an event-driven architecture with RabbitMQ or AWS SQS.

Flow
API receives the request
Pushes a broadcast job to a queue
Worker inserts notifications in bulk
Separate queues handle emails and WebSocket pushes
Failed tasks go to a Dead Letter Queue (DLQ) with retries

This makes the system scalable and fault-tolerant.

Should Email and DB Save Happen Together?

No.

Database writes are fast, while external email APIs are slower and unreliable. Keeping them separate prevents external failures from affecting the notification system.




Stage 6
Priority Inbox Logic

I would prioritize notifications using:

Type Weight
Placement → 3
Result → 2
Event → 1
Timestamp
More recent notifications appear first within the same category.
Efficient Top-N Notifications

Sorting the full notification list repeatedly is inefficient.

Instead, I’d use a Min-Heap (Priority Queue) to maintain the top 10 notifications in real time.

Why Min-Heap?
Insertions/removals happen in O(log N)
Only the most important notifications are kept
Works efficiently with real-time WebSocket streams