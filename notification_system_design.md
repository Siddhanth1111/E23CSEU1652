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

{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}


# Stage 2

### Persistent Storage (DB) Choice
**Choice:** PostgreSQL (Relational) with Prisma ORM.
**Explanation:** PostgreSQL provides strong ACID compliance, ensuring that notification states (like read/unread) remain perfectly consistent. Modern PostgreSQL also features robust `JSONB` support, allowing us to store flexible, schema-less metadata for varying notification types ("Result", "Placement", "Event") while maintaining rigid relationships and indexing on core fields.

### Database Schema (Prisma)


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





# Stage 3

### Query Accuracy and Performance
**Is the query accurate?**
Functionally, the syntax is valid, but from a product perspective, it is flawed. It uses `ORDER BY createdAt ASC`, which fetches the *oldest* unread notifications first. Users expect to see the most recent notifications, which requires `DESC`. Additionally, it lacks a `LIMIT` clause, meaning a student with thousands of unread notifications will pull a massive payload.

**Why is it slow?**
1. **Full Table Scan:** Without an index specifically covering `studentID` and `isRead`, the database must sequentially scan all 5,000,000 rows to find matches.
2. **Sort Overhead:** Because the data is not indexed in sorted order, the database must perform an expensive in-memory or disk-based sort operation on the results before returning them.
3. **Data Transfer:** `SELECT *` fetches every column, including heavy text or JSON metadata, consuming excessive memory and network bandwidth.

### Proposed Changes and Computation Cost
**Changes:**
1. Update the query to fetch recent notifications and limit the payload:
   `SELECT id, notificationType, message, createdAt FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC LIMIT 20;`
2. Create a **Composite B-Tree Index** to support this exact query pattern:
   `CREATE INDEX idx_student_unread_recent ON notifications (studentID, isRead, createdAt DESC);`

**Computation Cost:**
* **Before:** O(N) where N is 5,000,000 (Full Table Scan).
* **After:** O(log N) for the index seek, plus O(1) to read the limited rows. The database engine jumps directly to the student's records, filters by `isRead`, and reads the pre-sorted timestamps instantly.

### Indexing Every Column
**Is this advice effective?** No, it is highly destructive for a notification system. 

**Why/Why not?**
Notification systems are heavily write-intensive (high volume of inserts). Every time a new notification is inserted, the database must update *every single index*. Adding indexes to every column will drastically degrade `INSERT` and `UPDATE` performance, create write locks, and cause massive storage bloat (the indexes could take up more disk space than the actual data). Indexes should be strictly tailored to frequent `WHERE`, `JOIN`, and `ORDER BY` clauses.

### SQL Query: Placement Notifications (Last 7 Days)

SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement' 
  AND createdAt >= NOW() - INTERVAL '7 days';



# Stage 3

### Query Accuracy and Performance
**Is the query accurate?**
Functionally, the syntax is valid, but from a product perspective, it is flawed. It uses `ORDER BY createdAt ASC`, which fetches the *oldest* unread notifications first. Users expect to see the most recent notifications, which requires `DESC`. Additionally, it lacks a `LIMIT` clause, meaning a student with thousands of unread notifications will pull a massive payload.

**Why is it slow?**
1. **Full Table Scan:** Without an index specifically covering `studentID` and `isRead`, the database must sequentially scan all 5,000,000 rows to find matches.
2. **Sort Overhead:** Because the data is not indexed in sorted order, the database must perform an expensive in-memory or disk-based sort operation on the results before returning them.
3. **Data Transfer:** `SELECT *` fetches every column, including heavy text or JSON metadata, consuming excessive memory and network bandwidth.

### Proposed Changes and Computation Cost
**Changes:**
1. Update the query to fetch recent notifications and limit the payload:
   `SELECT id, notificationType, message, createdAt FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC LIMIT 20;`
2. Create a **Composite B-Tree Index** to support this exact query pattern:
   `CREATE INDEX idx_student_unread_recent ON notifications (studentID, isRead, createdAt DESC);`

**Computation Cost:**
* **Before:** O(N) where N is 5,000,000 (Full Table Scan).
* **After:** O(log N) for the index seek, plus O(1) to read the limited rows. The database engine jumps directly to the student's records, filters by `isRead`, and reads the pre-sorted timestamps instantly.

### Indexing Every Column
**Is this advice effective?** No, it is highly destructive for a notification system. 

**Why/Why not?**
Notification systems are heavily write-intensive (high volume of inserts). Every time a new notification is inserted, the database must update *every single index*. Adding indexes to every column will drastically degrade `INSERT` and `UPDATE` performance, create write locks, and cause massive storage bloat (the indexes could take up more disk space than the actual data). Indexes should be strictly tailored to frequent `WHERE`, `JOIN`, and `ORDER BY` clauses.

### SQL Query: Placement Notifications (Last 7 Days)

SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement' 
  AND createdAt >= NOW() - INTERVAL '7 days';



# Stage 4
Solutions to Improve Performance
Fetching notifications heavily on every page load causes a read bottleneck. To resolve this, we must decouple the UI rendering from direct database queries.

1. Cache Unread Counts in Memory (Redis)
The most common operation on page load is simply checking if the user has new notifications (the badge count).

Implementation: Store a key-value pair in Redis (e.g., unread_count:student:1042). When a notification is created, increment this cache (INCR). When read, decrement it (DECR). The frontend fetches this count in O(1) time without touching the SQL database.

2. Push via WebSockets instead of Client Polling
Instead of the client requesting data on every page transition, establish a persistent WebSocket connection upon login.

Implementation: The backend pushes new notification payloads directly to the active client socket. The frontend stores this in global state (like React Context or Redux). Page loads read from this local state instead of making network requests.

3. Implement Aggressive Pagination / Cursor-based Fetching
When the user explicitly opens the notification tray, do not fetch all notifications.

Implementation: Use cursor-based pagination to fetch only the first 10-20 notifications. Further notifications are only queried if the user scrolls to the bottom of the list.


