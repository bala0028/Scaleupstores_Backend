import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as paymentController from './payment.controller';
import { paymentSchemas } from './payment.schema';

export default async function paymentRoutes(app: FastifyInstance) {
  app.post('/orders/reserve/', { schema: paymentSchemas.reserveOrder, preHandler: [authenticate] }, paymentController.reserveOrder);
  app.post('/orders/verify/', { schema: paymentSchemas.verifyPayment, preHandler: [authenticate] }, paymentController.verifyPayment);
  app.post('/razorpay/webhook/', paymentController.razorpayWebhook);
  app.get('/payments/status/:razorpayOrderId/', { schema: paymentSchemas.getPaymentStatus, preHandler: [authenticate] }, paymentController.getPaymentStatus);
  app.post('/payments/log-frontend-event/', { schema: paymentSchemas.logFrontendEvent }, paymentController.logFrontendEvent);
  app.get('/order-tracking/:orderNumber/', { schema: paymentSchemas.getOrderTracking }, paymentController.getOrderTracking);
  app.get('/orders-history/:customerId/', { schema: paymentSchemas.getOrderHistory, preHandler: [authenticate] }, paymentController.getOrderHistory);
  app.get('/settings/gst/', paymentController.getGstSetting);
  app.put('/settings/gst/', { schema: paymentSchemas.updateGstSetting, preHandler: [authenticate, requireAdmin] }, paymentController.updateGstSetting);
  app.get('/settings/courier-charge/', paymentController.getCourierChargeSetting);
  app.put('/settings/courier-charge/', { schema: paymentSchemas.updateCourierChargeSetting, preHandler: [authenticate, requireAdmin] }, paymentController.updateCourierChargeSetting);
  app.get('/settings/courier-slabs/', { preHandler: [authenticate, requireAdmin] }, paymentController.getCourierChargeSlabs);
  app.post('/settings/courier-slabs/', { preHandler: [authenticate, requireAdmin] }, paymentController.upsertCourierChargeSlab);
  app.delete('/settings/courier-slabs/:id/', { preHandler: [authenticate, requireAdmin] }, paymentController.deleteCourierChargeSlab);
  app.post('/courier/calculate/', { preHandler: [authenticate] }, paymentController.calculateCourierCharge);
  app.get('/settings/dashboard-sections/', { preHandler: [authenticate, requireAdmin] }, paymentController.getDashboardSectionVisibility);
  app.put('/settings/dashboard-sections/', { schema: paymentSchemas.updateDashboardSectionVisibility, preHandler: [authenticate, requireAdmin] }, paymentController.updateDashboardSectionVisibility);
}
