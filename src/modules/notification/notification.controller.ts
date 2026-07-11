import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../../types';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import * as notificationService from './notification.service';

export async function listNotifications(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { customer_id } = request.params as any;
    const notifications = await notificationService.getByCustomer(parseInt(customer_id));
    return sendSuccess(reply, notifications);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function markAsRead(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await notificationService.markRead(parseInt(id));
    return sendSuccess(reply, existing, 'Notification marked as read');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { customer_id } = request.params as any;
    await notificationService.markAllRead(parseInt(customer_id));
    return sendSuccess(reply, null, 'All notifications marked as read');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteNotification(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const notificationId = parseInt(id);
    const existing = await notificationService.getById(notificationId);
    if (!existing) return sendNotFound(reply, 'Notification not found');
    await notificationService.remove(notificationId);
    return sendSuccess(reply, null, 'Notification deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function clearAllNotifications(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { customer_id } = request.params as any;
    await notificationService.clearAll(parseInt(customer_id));
    return sendSuccess(reply, null, 'All notifications cleared');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function requestStockNotification(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const { product_id, user_id } = request.body as any;
    if (!product_id) return sendError(reply, 'product_id is required', 400);
    const userId = user_id || (request.user?.id);
    if (!userId) return sendError(reply, 'User identification required', 400);
    const result = await notificationService.requestStockNotification(parseInt(product_id), parseInt(userId));
    return sendSuccess(reply, result, 'Stock notification requested');
  } catch (error: any) {
    if (error.code === 'P2003') {
      return sendError(reply, 'Invalid product_id or user_id. Make sure the product and customer exist.', 400);
    }
    return sendServerError(reply, error);
  }
}
