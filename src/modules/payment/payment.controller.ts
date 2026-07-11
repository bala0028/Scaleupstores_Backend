import { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import prisma from '../../config/db';
import { verifyWebhookSignature } from '../../services/razorpayService';
import * as paymentService from './payment.service';

export async function reserveOrder(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { items, payment_method, order_data } = request.body as any;
    if (!items || !payment_method || !order_data) {
      return sendError(reply, 'items, payment_method, and order_data are required');
    }

    if ((request as any).user?.id) {
      order_data.customer = (request as any).user.id;
    }

    const result = await paymentService.reserveOrder(items, payment_method, order_data);
    return sendSuccess(reply, result, 'Order reserved', 201);
  } catch (error: any) {
    if (error.message?.startsWith('Product') || error.message?.startsWith('Insufficient')) {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function verifyPayment(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body as any;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(reply, 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required');
    }
    const result = await paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return sendSuccess(reply, result, 'Payment verified');
  } catch (error: any) {
    if (error.message === 'Payment verification failed' || error.message === 'Order not found') {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function razorpayWebhook(request: FastifyRequest, reply: FastifyReply) {
  try {
    const signature = request.headers['x-razorpay-signature'] as string;
    const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

    if (!signature || !verifyWebhookSignature(body, signature)) {
      return reply.status(200).send({ status: 'ok' });
    }

    const event = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    await paymentService.handleWebhook(event);
  } catch {
    // Always return 200 for webhooks
  }
  return reply.status(200).send({ status: 'ok' });
}

export async function getPaymentStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { razorpayOrderId } = request.params as any;
    const result = await paymentService.getPaymentStatus(razorpayOrderId);
    if (!result) return sendNotFound(reply, 'Order not found');
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function logFrontendEvent(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body;
    await prisma.frontendAuthLog.create({ data: { data: data as any } });
    return sendSuccess(reply, null, 'Logged');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getOrderTracking(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderNumber } = request.params as any;
    const order = await paymentService.getOrderTracking(orderNumber);
    if (!order) return sendNotFound(reply, 'Order not found');
    return sendSuccess(reply, order);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getOrderHistory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { customerId } = request.params as any;
    const { page = '1', page_size = '10' } = request.query as any;
    const result = await paymentService.getOrderHistory(
      parseInt(customerId),
      parseInt(page),
      parseInt(page_size),
    );
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getGstSetting(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await paymentService.getGstSetting();
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateGstSetting(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { gst_percentage } = request.body as any;
    if (gst_percentage === undefined || gst_percentage < 0 || gst_percentage > 100) {
      return sendError(reply, 'gst_percentage must be between 0 and 100');
    }
    const result = await paymentService.updateGstSetting(gst_percentage);
    return sendSuccess(reply, result, 'GST setting updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCourierChargeSetting(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await paymentService.getCourierCharge();
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateCourierChargeSetting(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { courier_charge } = request.body as any;
    if (courier_charge === undefined || courier_charge < 0) {
      return sendError(reply, 'courier_charge must be a non-negative number');
    }
    const result = await paymentService.updateCourierCharge(courier_charge);
    return sendSuccess(reply, result, 'Courier charge updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getDashboardSectionVisibility(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await paymentService.getDashboardSectionVisibility();
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateDashboardSectionVisibility(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    const result = await paymentService.updateDashboardSectionVisibility(data);
    return sendSuccess(reply, result, 'Dashboard section visibility updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCourierChargeSlabs(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await paymentService.getCourierChargeSlabs();
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function upsertCourierChargeSlab(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body as any;
    const result = await paymentService.upsertCourierChargeSlab(data);
    return sendSuccess(reply, result, 'Courier charge slab saved');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteCourierChargeSlab(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    await paymentService.deleteCourierChargeSlab(Number(id));
    return sendSuccess(reply, null, 'Courier charge slab deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function calculateCourierCharge(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { items, state } = request.body as any;
    const result = await paymentService.calculateCourierChargeForCart(items, state || '');
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}
