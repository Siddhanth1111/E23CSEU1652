import { Router } from 'express';
import { Log } from 'logging-middleware';
import { getNotifications, getUnreadCount, markNotificationRead } from '../controllers/notificationController';

const router = Router();

router.use((req, res, next) => {
  Log("backend", "info", "route", `Route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationRead);

export default router;