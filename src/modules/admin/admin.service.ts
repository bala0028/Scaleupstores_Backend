import prisma from '../../config/db';

export async function getDashboard() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalCustomers,
    totalProducts,
    totalOrders,
    revenueAgg,
    recentOrders,
    ordersByStatus,
    lowStockProducts,
    todayOrders,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { orderStatus: 'delivered' },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { id: true },
    }),
    prisma.product.findMany({
      where: { stockQuantity: { lt: 10 }, isActive: true },
      select: { id: true, productName: true, stockQuantity: true, image: true },
      orderBy: { stockQuantity: 'asc' },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const entry of ordersByStatus) {
    statusMap[entry.orderStatus] = entry._count.id;
  }

  return {
    total_customers: totalCustomers,
    total_products: totalProducts,
    total_orders: totalOrders,
    total_revenue: revenueAgg._sum.totalAmount || 0,
    recent_orders: recentOrders,
    orders_by_status: statusMap,
    low_stock_products: lowStockProducts,
    today_orders: todayOrders,
  };
}
