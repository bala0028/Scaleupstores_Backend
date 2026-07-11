import prisma from '../../config/db';

export async function getByCustomer(customerId: number) {
  return prisma.notification.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markRead(id: number) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllRead(customerId: number) {
  return prisma.notification.updateMany({
    where: { customerId, isRead: false },
    data: { isRead: true },
  });
}

export async function getById(id: number) {
  return prisma.notification.findUnique({ where: { id } });
}

export async function remove(id: number) {
  return prisma.notification.delete({ where: { id } });
}

export async function clearAll(customerId: number) {
  return prisma.notification.deleteMany({
    where: { customerId },
  });
}

export async function requestStockNotification(productId: number, userId: number) {
  return prisma.stockNotification.upsert({
    where: { productId_customerId: { productId, customerId: userId } },
    update: { isNotified: false },
    create: { productId, customerId: userId },
  });
}
