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


# Stage 2

### Persistent Storage (DB) Choice
**Choice:** PostgreSQL (Relational) with Prisma ORM.
**Explanation:** PostgreSQL provides strong ACID compliance, ensuring that notification states (like read/unread) remain perfectly consistent. Modern PostgreSQL also features robust `JSONB` support, allowing us to store flexible, schema-less metadata for varying notification types ("Result", "Placement", "Event") while maintaining rigid relationships and indexing on core fields.

### Database Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Notification {
  id          String   @id @default(uuid())
  userId      String   // Foreign key to User table
  externalId  String   @unique // Maps to 'ID' from evaluation API
  type        String   // e.g., "Result", "Placement", "Event"
  message     String
  timestamp   DateTime @default(now())
  isRead      Boolean  @default(false)

  // Composite index for ultra-fast unread queries
  @@index([userId, isRead, timestamp(sort: Desc)])
}

Scaling Problems & Solutions


Problem: Millions of historical notifications will slow down query times and consume disk space.
Solution: Implement PostgreSQL Table Partitioning by date (e.g., partitioning the Notification table by month). Combine this with a cron job (using a cron_job package) to archive or drop partitions older than 30-60 days.


Problem: Running COUNT() on the database for every user session strains the DB's CPU.
Solution: Cache the unread count in Redis. Update the Redis counter dynamically when a notification is created or marked as read, bypassing PostgreSQL for purely read-heavy badge updates.


Problem: Sending an "Event" notification to all students simultaneously will overwhelm the database connections.
Solution: Utilize a message broker (like RabbitMQ or AWS SQS). The system queues the broadcast, and worker services consume the queue, utilizing Prisma's createMany for efficient batch inserts.


DB Queries (Prisma Client & SQL)

1. Fetch Notifications:
await prisma.notification.findMany({
  where: { userId: currentUserId },
  orderBy: { timestamp: 'desc' },
  take: 50
});
SQL-
SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "timestamp" DESC LIMIT 50;

2. Get Unread Count:
await prisma.notification.count({
  where: { 
    userId: currentUserId, 
    isRead: false 
  }
});
SQL - SELECT COUNT(*) FROM "Notification" WHERE "userId" = $1 AND "isRead" = false;

3. Mark as Read:
await prisma.notification.update({
  where: { externalId: notificationId },
  data: { isRead: true }
});
SQL - UPDATE "Notification" SET "isRead" = true WHERE "externalId" = $1;




