import {
  createRazorpayOrder,
  verifyPaymentSignature,
  getPaymentById,
  verifyWebhookSignature,
} from '../../services/razorpayService';
import { sendOrderConfirmationEmail } from '../../services/emailService';
import prisma from '../../config/db';

export function generateOrderNumber(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return `ORD-${today}-${rand}`;
}

async function getInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${String(count + 1).padStart(8, '0')}`;
}

async function getCourierChargeForState(state: string, totalWeightKg: number): Promise<number> {
  // Try state-specific slab first
  const slab = await prisma.courierChargeSetting.findFirst({
    where: {
      state: { equals: state.toLowerCase().trim(), mode: 'insensitive' },
      minWeight: { lte: totalWeightKg },
      maxWeight: { gte: totalWeightKg },
    },
  });
  if (slab) return slab.courierCharge;

  // Try default slab (state = null or isDefault = true)
  const defaultSlab = await prisma.courierChargeSetting.findFirst({
    where: {
      isDefault: true,
      minWeight: { lte: totalWeightKg },
      maxWeight: { gte: totalWeightKg },
    },
  });
  if (defaultSlab) return defaultSlab.courierCharge;

  // Fallback to flat setting
  const setting = await prisma.setting.findUnique({ where: { key: 'courier_charge' } });
  return setting ? parseFloat(setting.value) : 100;
}

export async function reserveOrder(
  items: Array<{ product: number; quantity: number }>,
  paymentMethod: 'online' | 'cod',
  orderData: {
    customer: number;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    secondaryNumber?: string;
    shippingAddress: string;
    billingAddress?: string;
    state?: string;
  },
) {
  const productIds = items.map((item) => item.product);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.product);
    if (!product) throw new Error(`Product ${item.product} not found`);
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for product ${product.productName}`);
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.product)!;
    return sum + product.price * item.quantity;
  }, 0);

  const gstSetting = await prisma.setting.findUnique({ where: { key: 'gst_percentage' } });
  const gstPercentage = gstSetting ? parseFloat(gstSetting.value) : 0;
  const tax = subtotal * (gstPercentage / 100);

  // Calculate total weight from product weights
  let totalWeightKg = 0;
  for (const item of items) {
    const product = productMap.get(item.product)!;
    if (product.weight) {
      const w = parseFloat(product.weight);
      if (!isNaN(w)) totalWeightKg += w * item.quantity;
    }
  }

  const state = orderData.state || '';
  const courierCharge = await getCourierChargeForState(state, totalWeightKg);

  const totalAmount = subtotal + tax + courierCharge;
  const orderNumber = generateOrderNumber();

  const orderPayload: any = {
    orderNumber,
    customerId: orderData.customer,
    firstName: orderData.firstName,
    lastName: orderData.lastName,
    contactNumber: orderData.contactNumber,
    secondaryNumber: orderData.secondaryNumber,
    shippingAddress: orderData.shippingAddress,
    billingAddress: orderData.billingAddress,
    subtotal,
    tax,
    shippingCost: courierCharge,
    totalAmount,
    items: {
      create: items.map((item) => ({
        productId: item.product,
        quantity: item.quantity,
        price: productMap.get(item.product)!.price,
        total: productMap.get(item.product)!.price * item.quantity,
      })),
    },
  };

  if (paymentMethod === 'online') {
    const razorpayOrder = await createRazorpayOrder(totalAmount, 'INR', orderNumber);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: { ...orderPayload, paymentMethod: 'online', razorpayOrderId: razorpayOrder.id },
        include: { items: true },
      });
      await tx.paymentLog.create({
        data: {
          orderId: created.id,
          event: 'CREATED',
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
        },
      });
      return created;
    });

    return {
      order,
      razorpay_order_id: razorpayOrder.id,
      amount: totalAmount,
      razorpay_order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    };
  }

  // COD — create order AND deduct stock atomically
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: { ...orderPayload, paymentMethod: 'cod' },
      include: { items: true },
    });

    // Deduct stock for COD immediately
    for (const item of items) {
      await tx.product.update({
        where: { id: item.product },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    await tx.paymentLog.create({
      data: { orderId: created.id, event: 'CREATED', amount: totalAmount },
    });

    return created;
  });

  return { order, razorpay_order_id: null, amount: totalAmount };
}

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    throw new Error('Payment verification failed');
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!order) throw new Error('Order not found');

  const paymentDetails: any = await getPaymentById(razorpayPaymentId);

  const [updatedOrder] = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'success', orderStatus: 'order_confirmed', razorpayPaymentId },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: paymentDetails.amount ? paymentDetails.amount / 100 : order.totalAmount,
        currency: paymentDetails.currency || 'INR',
        status: 'captured',
        method: paymentDetails.method || 'online',
      },
    });

    await tx.paymentLog.create({
      data: {
        orderId: order.id,
        event: 'SUCCESS',
        razorpayOrderId,
        razorpayPaymentId,
        amount: paymentDetails.amount ? paymentDetails.amount / 100 : order.totalAmount,
      },
    });

    // Deduct stock for online payment
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }

    // Create invoice
    const invoiceNumber = await getInvoiceNumber();
    await tx.invoice.create({
      data: { orderId: order.id, invoiceNumber },
    });

    return [updated];
  });

  if (order.customer?.email) {
    const itemsHtml = order.items
      .map((i) => `<p>${i.product.productName} x ${i.quantity} - Rs.${i.total}</p>`)
      .join('');
    await sendOrderConfirmationEmail(
      order.customer.email,
      order.orderNumber,
      `<p>Total: Rs.${order.totalAmount}</p>${itemsHtml}`,
    );
  }

  return { order: updatedOrder, payment: paymentDetails };
}

export async function handleWebhook(event: any) {
  const { event: eventName, payload } = event;

  if (eventName === 'payment.captured' && payload.payment?.entity) {
    const payment = payload.payment.entity;
    const order = await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } });
    if (order) {
      // Check for duplicate webhook
      const existing = await prisma.paymentLog.findFirst({
        where: { orderId: order.id, event: 'WEBHOOK_RECEIVED', razorpayPaymentId: payment.id },
      });
      if (existing) {
        await prisma.paymentLog.create({
          data: {
            orderId: order.id,
            event: 'WEBHOOK_DUPLICATE',
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
          },
        });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'success', razorpayPaymentId: payment.id },
        });
        await tx.payment.create({
          data: {
            orderId: order.id,
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            status: 'captured',
            method: payment.method,
          },
        });
        await tx.paymentLog.create({
          data: {
            orderId: order.id,
            event: 'WEBHOOK_RECEIVED',
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            amount: payment.amount / 100,
          },
        });
      });
    }
  }

  if (eventName === 'payment.failed' && payload.payment?.entity) {
    const payment = payload.payment.entity;
    const order = await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } });
    if (order) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'failed' },
        });
        await tx.payment.create({
          data: {
            orderId: order.id,
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            status: 'failed',
            method: payment.method,
            errorCode: payment.error_code,
            errorDescription: payment.error_description,
          },
        });
        await tx.paymentLog.create({
          data: {
            orderId: order.id,
            event: 'WEBHOOK_ERROR',
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
          },
        });
      });
    }
  }
}

export async function getPaymentStatus(razorpayOrderId: string) {
  return prisma.order.findUnique({
    where: { razorpayOrderId },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      orderStatus: true,
      totalAmount: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
    },
  });
}

export async function getOrderTracking(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: { product: { select: { id: true, productName: true, image: true } } },
      },
    },
  });
}

export async function getOrderHistory(customerId: number, page: number = 1, pageSize: number = 10) {
  const where = { customerId };
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: { select: { id: true, productName: true, image: true } } },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total, page, page_size: pageSize };
}

export async function getGstSetting() {
  const setting = await prisma.setting.findUnique({ where: { key: 'gst_percentage' } });
  return { gst_percentage: setting ? parseFloat(setting.value) : 0 };
}

export async function updateGstSetting(percentage: number) {
  const setting = await prisma.setting.upsert({
    where: { key: 'gst_percentage' },
    update: { value: String(percentage) },
    create: { key: 'gst_percentage', value: String(percentage) },
  });
  return { gst_percentage: parseFloat(setting.value) };
}

export async function getCourierCharge() {
  const setting = await prisma.setting.findUnique({ where: { key: 'courier_charge' } });
  return { courier_charge: setting ? parseFloat(setting.value) : 0 };
}

export async function updateCourierCharge(charge: number) {
  const setting = await prisma.setting.upsert({
    where: { key: 'courier_charge' },
    update: { value: String(charge) },
    create: { key: 'courier_charge', value: String(charge) },
  });
  return { courier_charge: parseFloat(setting.value) };
}

const DASHBOARD_SECTIONS_KEY = 'dashboard_section_visibility';
const DEFAULT_DASHBOARD_SECTIONS = {
  needsAttention: true,
  sales: true,
  fulfillment: true,
  inventory: true,
  customers: true,
};

export async function getDashboardSectionVisibility() {
  const setting = await prisma.setting.findUnique({ where: { key: DASHBOARD_SECTIONS_KEY } });
  if (!setting) return { ...DEFAULT_DASHBOARD_SECTIONS };
  try {
    return { ...DEFAULT_DASHBOARD_SECTIONS, ...JSON.parse(setting.value) };
  } catch {
    return { ...DEFAULT_DASHBOARD_SECTIONS };
  }
}

export async function updateDashboardSectionVisibility(data: Partial<typeof DEFAULT_DASHBOARD_SECTIONS>) {
  const current = await getDashboardSectionVisibility();
  const merged = { ...current, ...data };
  await prisma.setting.upsert({
    where: { key: DASHBOARD_SECTIONS_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: DASHBOARD_SECTIONS_KEY, value: JSON.stringify(merged) },
  });
  return merged;
}

export async function getCourierChargeSlabs() {
  return prisma.courierChargeSetting.findMany({ orderBy: [{ state: 'asc' }, { minWeight: 'asc' }] });
}

export async function upsertCourierChargeSlab(data: {
  id?: number;
  state?: string;
  minWeight: number;
  maxWeight: number;
  courierCharge: number;
  isDefault?: boolean;
}) {
  if (data.id) {
    return prisma.courierChargeSetting.update({
      where: { id: data.id },
      data: {
        state: data.state ?? null,
        minWeight: data.minWeight,
        maxWeight: data.maxWeight,
        courierCharge: data.courierCharge,
        isDefault: data.isDefault ?? false,
      },
    });
  }
  return prisma.courierChargeSetting.create({
    data: {
      state: data.state ?? null,
      minWeight: data.minWeight,
      maxWeight: data.maxWeight,
      courierCharge: data.courierCharge,
      isDefault: data.isDefault ?? false,
    },
  });
}

export async function deleteCourierChargeSlab(id: number) {
  return prisma.courierChargeSetting.delete({ where: { id } });
}

export async function calculateCourierChargeForCart(
  items: Array<{ product: number; quantity: number }>,
  state: string,
) {
  const productIds = items.map((i) => i.product);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalWeightKg = 0;
  for (const item of items) {
    const product = productMap.get(item.product);
    if (product?.weight) {
      const w = parseFloat(product.weight);
      if (!isNaN(w)) totalWeightKg += w * item.quantity;
    }
  }

  const charge = await getCourierChargeForState(state, totalWeightKg);
  return { courier_charge: charge, total_weight: totalWeightKg };
}
