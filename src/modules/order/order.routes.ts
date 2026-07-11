import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as orderController from './order.controller';
import { orderSchemas } from './order.schema';

export default async function orderRoutes(app: FastifyInstance) {
  app.post('/orderdetails/', { schema: orderSchemas.createOrder, preHandler: [authenticate, requireAdmin] }, orderController.createOrder);
  app.get('/orderdetails/', { preHandler: [authenticate, requireAdmin] }, orderController.listOrders);
  app.get('/orderdetails/:id/', { schema: orderSchemas.getOrderById, preHandler: [authenticate, requireAdmin] }, orderController.getOrderById);
  app.put('/orderdetails/:id/', { schema: orderSchemas.updateOrder, preHandler: [authenticate, requireAdmin] }, orderController.updateOrder);
  app.delete('/orderdetails/:id/', { schema: orderSchemas.deleteOrder, preHandler: [authenticate, requireAdmin] }, orderController.deleteOrder);
  app.put('/order-status/:id/', { schema: orderSchemas.updateOrderStatus, preHandler: [authenticate, requireAdmin] }, orderController.updateOrderStatus);
  app.get('/orders/unprinted/', { schema: orderSchemas.getUnprintedOrders, preHandler: [authenticate, requireAdmin] }, orderController.getUnprintedOrders);
  app.post('/checkout-initiate/', { schema: orderSchemas.checkoutInitiate, preHandler: [authenticate] }, orderController.checkoutInitiate);
  app.post('/checkout-validate/', { schema: orderSchemas.checkoutValidate, preHandler: [authenticate] }, orderController.checkoutValidate);
  app.get('/orderspdf/:orderId/', { schema: orderSchemas.downloadInvoicePdf, preHandler: [authenticate, requireAdmin] }, orderController.downloadInvoicePdf);
  app.post('/orders/print-address/', { schema: orderSchemas.batchAddressLabels, preHandler: [authenticate, requireAdmin] }, orderController.batchAddressLabels);
  app.post('/single-orders/print-address/', { schema: orderSchemas.singleAddressLabel, preHandler: [authenticate, requireAdmin] }, orderController.singleAddressLabel);
}
