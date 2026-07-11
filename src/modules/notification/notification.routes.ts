import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/auth.middleware';
import * as notificationController from './notification.controller';
import { notificationSchemas } from './notification.schema';

export default async function notificationRoutes(app: FastifyInstance) {
  app.get('/customer-notifications/:customer_id', { schema: notificationSchemas.listNotifications, preHandler: [authenticate] }, notificationController.listNotifications);
  app.put('/readnotifications/:id', { schema: notificationSchemas.markAsRead, preHandler: [authenticate] }, notificationController.markAsRead);
  app.put('/readnotifications/all/:customer_id', { schema: notificationSchemas.markAllAsRead, preHandler: [authenticate] }, notificationController.markAllAsRead);
  app.delete('/notification/:id', { schema: notificationSchemas.deleteNotification, preHandler: [authenticate] }, notificationController.deleteNotification);
  app.delete('/notifications/clear/:customer_id', { schema: notificationSchemas.clearAllNotifications, preHandler: [authenticate] }, notificationController.clearAllNotifications);
  app.post('/stocknotify/', { schema: notificationSchemas.requestStockNotification, preHandler: [authenticate] }, notificationController.requestStockNotification);
}
