import { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import * as orderService from './order.service';
import prisma from '../../config/db';

export async function createOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    console.log('[createOrder] Request body:', JSON.stringify(body, null, 2));

    if (!body.shippingAddress) {
      return sendError(reply, 'Shipping address is required');
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return sendError(reply, 'items array is required');
    }

    const order = await orderService.createOrder(body);
    console.log('[createOrder] Success:', order.id);
    return sendSuccess(reply, order, 'Order created', 201);
  } catch (error: any) {
    console.error('[createOrder] Error:', error);
    return sendServerError(reply, error);
  }
}

export async function listOrders(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { page, page_size, search } = request.query as any;
    const result = await orderService.getAll({
      page: page ? parseInt(page) : undefined,
      pageSize: page_size ? parseInt(page_size) : undefined,
      search,
    });
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getOrderById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const order = await orderService.getById(parseInt(id));
    if (!order) return sendNotFound(reply, 'Order not found');
    return sendSuccess(reply, order);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await orderService.getById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Order not found');

    const order = await orderService.updateOrder(parseInt(id), request.body);
    return sendSuccess(reply, order, 'Order updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await orderService.getById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Order not found');
    await orderService.deleteOrder(parseInt(id));
    return sendSuccess(reply, null, 'Order deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

const validStatuses = ['pending', 'order_confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export async function updateOrderStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const { order_status, courier_number } = request.body as any;

    if (!order_status || !validStatuses.includes(order_status)) {
      return sendError(reply, `order_status must be one of: ${validStatuses.join(', ')}`);
    }

    if (order_status === 'shipped' && !courier_number) {
      return sendError(reply, 'courier_number is required when status is shipped');
    }

    const order = await orderService.updateStatus(parseInt(id), order_status, courier_number);
    if (!order) return sendNotFound(reply, 'Order not found');
    return sendSuccess(reply, order, 'Order status updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getUnprintedOrders(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { from_date, to_date } = request.query as any;
    const orders = await orderService.getUnprinted(from_date, to_date);
    return sendSuccess(reply, orders);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function checkoutInitiate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { cart } = request.body as any;
    const user_id = (request as any).user?.id || (request.body as any).user_id;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return sendError(reply, 'Make sure some products in the cart');
    }

    const result = await orderService.checkoutInitiate(parseInt(user_id), cart);

    if (result.outOfStock.length > 0) {
      return sendError(reply, 'Some items are out of stock', 400, { out_of_stock: result.outOfStock });
    }

    return sendSuccess(reply, { items: result.items, subtotal: result.subtotal });
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function checkoutValidate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user_id = (request as any).user?.id || (request.body as any).user_id;

    if (!user_id) {
      return sendError(reply, 'user_id is required');
    }

    const result = await orderService.checkoutValidate(parseInt(user_id));
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function downloadInvoicePdf(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = request.params as any;
    const order = await orderService.getInvoice(parseInt(orderId));
    if (!order) return sendNotFound(reply, 'Order not found');

    const { generateInvoicePdf } = await import('../../services/pdfService');
    const pdfBuffer = await generateInvoicePdf(order);

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    reply.header('Content-Length', pdfBuffer.length);
    return reply.send(pdfBuffer);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function batchAddressLabels(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { order_ids } = request.body as any;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return sendError(reply, 'Orders required');
    }

    const ids = order_ids.map((id: any) => parseInt(id));

    const orders = await prisma.order.findMany({
      where: { id: { in: ids } },
      include: { items: { include: { product: true } } },
    });

    if (orders.length === 0) {
      return sendNotFound(reply, 'No orders found');
    }

    // Mark as printed
    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { isPrinted: true } });

    const { generateAddressLabelsPdf } = await import('../../services/pdfService');
    const pdfBuffer = await generateAddressLabelsPdf(orders);

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="address-labels.pdf"');
    reply.header('Content-Length', pdfBuffer.length);
    return reply.send(pdfBuffer);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function singleAddressLabel(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { order_id } = request.body as any;
    if (!order_id) return sendError(reply, 'order_id is required');

    const order = await prisma.order.findUnique({
      where: { id: parseInt(order_id) },
      include: { items: { include: { product: true } } },
    });
    if (!order) return sendNotFound(reply, 'Order not found');

    await prisma.order.update({ where: { id: order.id }, data: { isPrinted: true } });

    const { generateAddressLabelsPdf } = await import('../../services/pdfService');
    const pdfBuffer = await generateAddressLabelsPdf([order]);

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="label-${order.orderNumber}.pdf"`);
    reply.header('Content-Length', pdfBuffer.length);
    return reply.send(pdfBuffer);
  } catch (error) {
    return sendServerError(reply, error);
  }
}
