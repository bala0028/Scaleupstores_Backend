import prisma from '../../config/db';
import { generateOrderNumber } from '../payment/payment.service';

export async function createOrder(data: any) {
  const orderNumber = generateOrderNumber();

  const subtotal = data.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + Number(data.tax ?? 0) + Number(data.shippingCost ?? 0);

  // Validate products exist
  const productIds = data.items.map((item: any) => item.product);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  const foundIds = new Set(products.map(p => p.id));
  const missingIds = productIds.filter((id: number) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(`Products not found: ${missingIds.join(', ')}`);
  }

  // Validate customer exists if provided
  if (data.customer) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customer },
      select: { id: true },
    });
    if (!customer) {
      throw new Error(`Customer with ID ${data.customer} not found`);
    }
  }

  try {
    return await prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customer ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        secondaryNumber: data.secondaryNumber,
        preferredCourierService: data.preferredCourierService,
        courierNumber: data.courierNumber,
        paymentMethod: data.paymentMethod ?? 'cod',
        paymentStatus: data.paymentStatus ?? 'pending',
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        subtotal,
        tax: Number(data.tax ?? 0),
        shippingCost: Number(data.shippingCost ?? 0),
        totalAmount,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.product,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax ?? 0,
            total: item.total,
          })),
        },
      },
      include: { items: true, customer: true },
    });
  } catch (error: any) {
    console.error('[createOrder] Error:', error);
    if (error.code === 'P2003') {
      // Check which field caused the FK error
      const meta = error.meta as any;
      if (meta?.field_name === 'customerId') {
        throw new Error(`Customer with ID ${data.customer} not found`);
      }
      throw new Error(`Foreign key constraint failed on field: ${meta?.field_name}`);
    }
    throw error;
  }
}

export async function getAll(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { page, pageSize, search } = params;

  const where: any = search
    ? {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search } },
          { customer: { is: { fullName: { contains: search, mode: 'insensitive' } } } },
          { customer: { is: { email: { contains: search, mode: 'insensitive' } } } },
          { customer: { is: { phone: { contains: search } } } },
        ],
      }
    : {};

  const include = { items: { include: { product: true } }, customer: true };
  const orderBy = { createdAt: 'desc' as const };

  if (page && pageSize) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.order.count({ where }),
    ]);
    return { orders, total, page, page_size: pageSize };
  }

  const orders = await prisma.order.findMany({ where, include, orderBy });
  return { orders, total: orders.length, page: 1, page_size: orders.length };
}

export async function getById(id: number) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      customer: true,
    },
  });
}

export async function updateOrder(id: number, data: any) {
  const updateData: any = {};
  if (data.customer !== undefined) updateData.customerId = data.customer;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.contactNumber !== undefined) updateData.contactNumber = data.contactNumber;
  if (data.secondaryNumber !== undefined) updateData.secondaryNumber = data.secondaryNumber;
  if (data.preferredCourierService !== undefined) updateData.preferredCourierService = data.preferredCourierService;
  if (data.courierNumber !== undefined) updateData.courierNumber = data.courierNumber;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
  if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress;
  if (data.billingAddress !== undefined) updateData.billingAddress = data.billingAddress;
  if (data.tax !== undefined) updateData.tax = Number(data.tax);
  if (data.shippingCost !== undefined) updateData.shippingCost = Number(data.shippingCost);

  return prisma.$transaction(async (tx) => {
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      const subtotal = data.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const totalAmount = subtotal + Number(data.tax ?? 0) + Number(data.shippingCost ?? 0);

      return tx.order.update({
        where: { id },
        data: {
          ...updateData,
          subtotal,
          totalAmount,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.product,
              quantity: item.quantity,
              price: item.price,
              tax: item.tax ?? 0,
              total: item.total,
            })),
          },
        },
        include: { items: { include: { product: true } }, customer: true },
      });
    }

    return tx.order.update({
      where: { id },
      data: updateData,
      include: { items: { include: { product: true } }, customer: true },
    });
  });
}

export async function deleteOrder(id: number) {
  return prisma.order.delete({ where: { id } });
}

const validStatuses = ['pending', 'order_confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export async function updateStatus(id: number, orderStatus: string, courierNumber?: string) {
  if (!validStatuses.includes(orderStatus)) {
    throw new Error(`orderStatus must be one of: ${validStatuses.join(', ')}`);
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: any = { orderStatus };
  if (courierNumber) {
    updateData.courierNumber = courierNumber;
  }

  if (orderStatus === 'delivered') {
    updateData.deliveredAt = new Date();
    if (existing.paymentMethod === 'cod') {
      updateData.paymentStatus = 'success';
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: { include: { product: true } }, customer: true },
  });

  if (order.customerId) {
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      order_confirmed: 'Order Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
    };
    await prisma.notification.create({
      data: {
        customerId: order.customerId,
        title: 'Order Status Updated',
        message: `Your order ${order.orderNumber} status has been updated to ${statusLabels[orderStatus] || orderStatus}`,
        type: 'order_status',
      },
    });
  }

  return order;
}

export async function getUnprinted(fromDate?: string, toDate?: string) {
  const where: any = { isPrinted: false };

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  return prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
      customer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

const RESERVATION_MINUTES = 10;

// Clear expired reservations for a product before checking stock
async function clearExpiredReservations(tx: any, productId: number) {
  await tx.productReservation.deleteMany({
    where: { productId, reservedUntil: { lt: new Date() } },
  });
}

// Get effectively available stock = stockQuantity minus active reservations by OTHER users
async function getAvailableStock(tx: any, productId: number, excludeUserId: number): Promise<number> {
  const product = await tx.product.findUnique({ where: { id: productId }, select: { stockQuantity: true } });
  if (!product) return 0;

  const reservedByOthers = await tx.productReservation.aggregate({
    where: {
      productId,
      customerId: { not: excludeUserId },
      reservedUntil: { gte: new Date() },
    },
    _sum: { quantity: true },
  });

  return product.stockQuantity - (reservedByOthers._sum.quantity ?? 0);
}

export async function checkoutInitiate(userId: number, cart: any[]) {
  return prisma.$transaction(async (tx) => {
    const outOfStock: any[] = [];
    const items: any[] = [];
    let subtotal = 0;

    // Clear this user's old reservations first
    await tx.productReservation.deleteMany({
      where: { customerId: userId, reservedUntil: { lt: new Date() } },
    });

    for (const item of cart) {
      const productId = item.product_id;
      const qty = item.qty || 1;

      await clearExpiredReservations(tx, productId);

      const available = await getAvailableStock(tx, productId, userId);
      const product = await tx.product.findUnique({ where: { id: productId } });

      if (!product) throw new Error(`Product not found: ${productId}`);

      if (available < qty) {
        outOfStock.push({
          product_id: product.id,
          name: product.productName,
          available,
          requested: qty,
        });
        continue;
      }

      // Upsert reservation for this user+product
      await tx.productReservation.upsert({
        where: {
          // no unique constraint — use findFirst + delete/create pattern
          id: (await tx.productReservation.findFirst({
            where: { customerId: userId, productId },
            select: { id: true },
          }))?.id ?? -1,
        },
        update: {
          quantity: qty,
          reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
        },
        create: {
          customerId: userId,
          productId,
          quantity: qty,
          reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
        },
      });

      const total = product.price * qty;
      subtotal += total;
      items.push({ product_id: product.id, name: product.productName, qty, price: product.price, total });
    }

    if (outOfStock.length > 0) {
      return { outOfStock, items: null, subtotal: 0 };
    }

    return { items, subtotal, outOfStock: [], reserved_until: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000) };
  });
}

export async function checkoutValidate(userId: number) {
  // Verify all reservations are still active
  const reservations = await prisma.productReservation.findMany({
    where: { customerId: userId, reservedUntil: { gte: new Date() } },
    include: { product: true },
  });

  if (reservations.length === 0) {
    return { valid: false, reason: 'No active reservations. Please re-initiate checkout.' };
  }

  // Check stock is still sufficient for reserved quantities
  const invalid: any[] = [];
  for (const r of reservations) {
    if (r.product.stockQuantity < r.quantity) {
      invalid.push({ product_id: r.productId, name: r.product.productName });
    }
  }

  if (invalid.length > 0) {
    return { valid: false, reason: 'Some items are out of stock', items: invalid };
  }

  return { valid: true, reservations };
}

export async function getInvoice(orderId: number) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, customer: true },
  });
}

export async function batchPrint(orderIds: number[]) {
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { isPrinted: true },
  });

  return prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true,
      orderNumber: true,
      firstName: true,
      lastName: true,
      contactNumber: true,
      shippingAddress: true,
      billingAddress: true,
    },
  });
}

export async function singlePrint(orderId: number) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      firstName: true,
      lastName: true,
      contactNumber: true,
      shippingAddress: true,
      billingAddress: true,
    },
  });
}
