const express = require('express');
const router = express.Router();
const {
  getComments,
  addComment,
  getAttachments,
  uploadAttachment,
  downloadAttachment,
  getActivityFeed,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  checkOverdueTasks,
  getAnalyticsSummary,
  auditMultiTenantIsolation,
} = require('../controllers/collaborationController');
const { protect } = require('../../member-4-database-auth/middlewares/authMiddleware');
const { scopeToOrganization } = require('../../member-4-database-auth/middlewares/roleMiddleware');

// All collaboration endpoints require authentication and organization scoping
router.use(protect);
router.use(scopeToOrganization);

// Comments
router.get('/tasks/:id/comments', getComments);
router.post('/tasks/:id/comments', addComment);

// Attachments
router.get('/tasks/:id/attachments', getAttachments);
router.post('/tasks/:id/attachments', uploadAttachment);
router.get('/attachments/:id/download', downloadAttachment);

// Activity feed
router.get('/activity', getActivityFeed);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.post('/notifications/overdue-check', checkOverdueTasks);

// Analytics & Multi-tenant audit
router.get('/analytics/summary', getAnalyticsSummary);
router.get('/analytics/multi-tenant-audit', auditMultiTenantIsolation);

module.exports = router;
