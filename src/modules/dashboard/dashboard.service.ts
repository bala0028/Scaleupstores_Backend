import prisma from '../../config/db';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

function getDateRange(days: number): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days + 1);
  return { startDate, endDate };
}

function getWeekRange(): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const day = startDate.getDay();
  startDate.setDate(startDate.getDate() - day);
  return { startDate, endDate };
}

function getMonthRange(): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate };
}

export async function getDashboardSummary() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [
    totalCustomers,
    totalProducts,
    totalOrders,
    revenueAgg,
    recentOrders,
    ordersByStatus,
    lowStockProducts,
    todayOrders,
    yesterdayOrders,
    revenueTodayAgg,
    revenueYesterdayAgg,
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
    prisma.order.count({
      where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.order.aggregate({
      where: { orderStatus: 'delivered', createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { orderStatus: 'delivered', createdAt: { gte: yesterdayStart, lt: todayStart } },
      _sum: { totalAmount: true },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const entry of ordersByStatus) {
    statusMap[entry.orderStatus] = entry._count.id;
  }

  const totalRevenue = revenueAgg._sum.totalAmount || 0;
  const revenueToday = revenueTodayAgg._sum.totalAmount || 0;
  const revenueYesterday = revenueYesterdayAgg._sum.totalAmount || 0;

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingOrders = statusMap['pending'] || 0;
  const lowStockCount = lowStockProducts.length;

  const newCustomersThisWeek = await prisma.customer.count({
    where: { createdAt: { gte: getWeekRange().startDate } },
  });
  const newCustomersLastWeek = await prisma.customer.count({
    where: { createdAt: { gte: new Date(getWeekRange().startDate.getTime() - 7 * 24 * 60 * 60 * 1000), lt: getWeekRange().startDate } },
  });

  const revenueChange = revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : 0;

  return {
    total_customers: totalCustomers,
    total_products: totalProducts,
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    recent_orders: recentOrders,
    orders_by_status: statusMap,
    low_stock_products: lowStockProducts,
    today_orders: todayOrders,
    avg_order_value: avgOrderValue,
    pending_orders: pendingOrders,
    low_stock_count: lowStockCount,
    new_customers_this_week: newCustomersThisWeek,
    new_customers_last_week: newCustomersLastWeek,
    revenue_today: revenueToday,
    revenue_yesterday: revenueYesterday,
    revenue_change_pct: revenueChange,
  };
}

export async function getSalesChart(days: number = 30) {
  const { startDate, endDate } = getDateRange(days);

  const orders = await prisma.order.findMany({
    where: {
      orderStatus: 'delivered',
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true, totalAmount: true },
  });

  const dailyRevenue: Record<string, number> = {};
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    dailyRevenue[key] = 0;
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().split('T')[0];
    if (dailyRevenue[key] !== undefined) {
      dailyRevenue[key] += order.totalAmount || 0;
    }
  }

  const chartData = Object.entries(dailyRevenue).map(([date, sales]) => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    sales: Number(sales.toFixed(2)),
  }));

  let peakDay = chartData[0];
  for (const day of chartData) {
    if (day.sales > peakDay.sales) peakDay = day;
  }

  return { chartData, peakDay };
}

export async function getOrdersByStatus() {
  const ordersByStatus = await prisma.order.groupBy({
    by: ['orderStatus'],
    _count: { id: true },
  });

  const data = ordersByStatus.map((entry) => ({
    status: entry.orderStatus,
    count: entry._count.id,
  }));

  return data;
}

export async function getTopProducts(limit: number = 10) {
  const orderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const productIds = orderItems.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, productName: true, image: true, price: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const result = orderItems.map((item) => {
    const product = productMap.get(item.productId);
    return {
      product_id: item.productId,
      product_name: product?.productName || 'Unknown',
      image: product?.image || null,
      price: product?.price || 0,
      total_sold: item._sum.quantity || 0,
      total_revenue: (item._sum.quantity || 0) * (product?.price || 0),
    };
  });

  return result;
}

export async function getCustomerGrowth(months: number = 12) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const customers = await prisma.customer.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { createdAt: true },
  });

  const monthlyCounts: Record<string, number> = {};
  for (let m = 0; m < months; m++) {
    const date = new Date(endDate.getFullYear(), endDate.getMonth() - m, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[key] = 0;
  }

  for (const customer of customers) {
    const key = `${customer.createdAt.getFullYear()}-${String(customer.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyCounts[key] !== undefined) {
      monthlyCounts[key]++;
    }
  }

  let cumulative = 0;
  const chartData = Object.entries(monthlyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      cumulative += count;
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        new_customers: count,
        cumulative_customers: cumulative,
      };
    });

  return chartData;
}

export async function getCategoryRevenue() {
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { orderStatus: 'delivered' } },
    include: {
      product: { include: { category: true } },
      order: true,
    },
  });

  const categoryRevenue: Record<string, number> = {};

  for (const item of orderItems) {
    const categoryName = item.product?.category?.categoryName || 'Uncategorized';
    const revenue = item.total || item.price * item.quantity;
    categoryRevenue[categoryName] = (categoryRevenue[categoryName] || 0) + revenue;
  }

  const data = Object.entries(categoryRevenue)
    .map(([category, revenue]) => ({ category, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue);

  return data;
}

export async function getHourlySales() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      orderStatus: 'delivered',
      createdAt: { gte: todayStart, lte: todayEnd },
    },
    select: { createdAt: true, totalAmount: true },
  });

  const hourlyData: Record<number, { orders: number; revenue: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { orders: 0, revenue: 0 };
  }

  for (const order of orders) {
    const hour = order.createdAt.getHours();
    hourlyData[hour].orders++;
    hourlyData[hour].revenue += order.totalAmount || 0;
  }

  const chartData = Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    orders: data.orders,
    revenue: Number(data.revenue.toFixed(2)),
  }));

  return chartData;
}

export async function getDayOfWeekSales() {
  const { startDate, endDate } = getDateRange(30);

  const orders = await prisma.order.findMany({
    where: {
      orderStatus: 'delivered',
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { createdAt: true, totalAmount: true },
  });

  const dowData: Record<number, { orders: number; revenue: number }> = {};
  for (let d = 0; d < 7; d++) {
    dowData[d] = { orders: 0, revenue: 0 };
  }

  for (const order of orders) {
    const dow = order.createdAt.getDay();
    dowData[dow].orders++;
    dowData[dow].revenue += order.totalAmount || 0;
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = Object.entries(dowData).map(([dow, data]) => ({
    day: dayNames[parseInt(dow)],
    dayIndex: parseInt(dow),
    orders: data.orders,
    revenue: Number(data.revenue.toFixed(2)),
  }));

  return chartData;
}

export async function getTopCustomers(limit: number = 10) {
  const customers = await prisma.customer.findMany({
    take: limit,
    include: {
      orders: {
        where: { orderStatus: 'delivered' },
        select: { totalAmount: true },
      },
    },
  });

  const topCustomers = customers
    .map((c) => ({
      id: c.id,
      name: c.fullName || c.email || `Customer #${c.id}`,
      email: c.email,
      phone: c.phone,
      total_orders: c.orders.length,
      total_spent: c.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }))
    .filter((c) => c.total_orders > 0)
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, limit);

  return topCustomers;
}

export async function getLowStockAlerts(threshold: number = 5) {
  const products = await prisma.product.findMany({
    where: { stockQuantity: { lt: threshold }, isActive: true },
    select: { id: true, productName: true, stockQuantity: true, image: true, price: true },
    orderBy: { stockQuantity: 'asc' },
  });

  return products.map((p) => ({
    id: p.id,
    product_name: p.productName,
    stock_quantity: p.stockQuantity,
    image: p.image,
    price: p.price,
    is_critical: p.stockQuantity === 0,
  }));
}

// ─── Needs Attention ─────────────────────────────────────────────

export async function getAttentionItems() {
  const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [pendingOrdersOverdue, failedPayments, codPendingConfirmation, unprintedLabels, unapprovedReviews] =
    await Promise.all([
      prisma.order.count({ where: { orderStatus: 'pending', createdAt: { lt: overdueThreshold } } }),
      prisma.order.count({ where: { paymentStatus: 'failed' } }),
      prisma.order.count({ where: { paymentMethod: 'cod', orderStatus: 'pending' } }),
      prisma.order.count({ where: { isPrinted: false } }),
      prisma.feedback.count({ where: { isApproved: false } }),
    ]);

  return {
    pending_orders_overdue: pendingOrdersOverdue,
    failed_payments: failedPayments,
    cod_pending_confirmation: codPendingConfirmation,
    unprinted_labels: unprintedLabels,
    unapproved_reviews: unapprovedReviews,
  };
}

// ─── Operations: payments, logistics, repeat customers ──────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

function extractState(address: string | null | undefined): string {
  if (!address) return 'Unknown';
  const found = INDIAN_STATES.find((state) => address.toLowerCase().includes(state.toLowerCase()));
  return found || 'Unknown';
}

async function getPaymentInsights(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { paymentMethod: true, paymentStatus: true, totalAmount: true, createdAt: true, deliveredAt: true },
  });

  let codCount = 0, codRevenue = 0, onlineCount = 0, onlineRevenue = 0, failedCount = 0;
  let deliveredDaysSum = 0, deliveredCount = 0;

  for (const order of orders) {
    const amount = order.totalAmount || 0;
    if (order.paymentMethod === 'cod') {
      codCount++;
      codRevenue += amount;
    } else {
      onlineCount++;
      onlineRevenue += amount;
    }
    if (order.paymentStatus === 'failed') failedCount++;
    if (order.deliveredAt) {
      deliveredDaysSum += (order.deliveredAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      deliveredCount++;
    }
  }

  return {
    cod_count: codCount,
    cod_revenue: Number(codRevenue.toFixed(2)),
    online_count: onlineCount,
    online_revenue: Number(onlineRevenue.toFixed(2)),
    payment_failure_rate: orders.length > 0 ? Number(((failedCount / orders.length) * 100).toFixed(1)) : 0,
    avg_delivery_days: deliveredCount > 0 ? Number((deliveredDaysSum / deliveredCount).toFixed(1)) : 0,
  };
}

async function getLogisticsInsights(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { shippingAddress: true, totalAmount: true, shippingCost: true },
  });

  const byState: Record<string, { orders: number; revenue: number }> = {};
  let totalShippingCost = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    const state = extractState(order.shippingAddress);
    if (!byState[state]) byState[state] = { orders: 0, revenue: 0 };
    byState[state].orders++;
    byState[state].revenue += order.totalAmount || 0;
    totalShippingCost += order.shippingCost || 0;
    totalRevenue += order.totalAmount || 0;
  }

  const stateBreakdown = Object.entries(byState)
    .map(([state, v]) => ({ state, orders: v.orders, revenue: Number(v.revenue.toFixed(2)) }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  return {
    by_state: stateBreakdown,
    total_shipping_cost: Number(totalShippingCost.toFixed(2)),
    total_revenue: Number(totalRevenue.toFixed(2)),
    shipping_cost_ratio_pct: totalRevenue > 0 ? Number(((totalShippingCost / totalRevenue) * 100).toFixed(1)) : 0,
  };
}

async function getRepeatCustomerRate() {
  const grouped = await prisma.order.groupBy({
    by: ['customerId'],
    where: { customerId: { not: null } },
    _count: { id: true },
  });

  const totalCustomersWithOrders = grouped.length;
  const repeatCustomers = grouped.filter((g) => g._count.id >= 2).length;

  return {
    total_customers_with_orders: totalCustomersWithOrders,
    repeat_customers: repeatCustomers,
    repeat_rate_pct: totalCustomersWithOrders > 0
      ? Number(((repeatCustomers / totalCustomersWithOrders) * 100).toFixed(1))
      : 0,
  };
}

export async function getOperationsInsights(days: number = 30) {
  const { startDate, endDate } = getDateRange(days);
  const [payment, logistics, repeatCustomers] = await Promise.all([
    getPaymentInsights(startDate, endDate),
    getLogisticsInsights(startDate, endDate),
    getRepeatCustomerRate(),
  ]);
  return { payment, logistics, repeat_customers: repeatCustomers };
}

// ─── Catalog: inventory health + category performance ───────────

async function getInventoryHealth(days: number = 30) {
  const { startDate } = getDateRange(days);

  const [outOfStockCount, activeProducts, soldProductIds] = await Promise.all([
    prisma.product.count({ where: { stockQuantity: 0, isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, stockQuantity: { gt: 0 } },
      select: { id: true, productName: true, stockQuantity: true, price: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: startDate } } },
      select: { productId: true },
      distinct: ['productId'],
    }),
  ]);

  const soldIds = new Set(soldProductIds.map((i) => i.productId));
  const deadStockAll = activeProducts.filter((p) => !soldIds.has(p.id));
  const deadStock = deadStockAll
    .slice(0, 10)
    .map((p) => ({ id: p.id, product_name: p.productName, stock_quantity: p.stockQuantity, price: p.price }));

  return {
    out_of_stock_count: outOfStockCount,
    dead_stock_count: deadStockAll.length,
    dead_stock_products: deadStock,
  };
}

async function getCategoryPerformance() {
  const [orderItems, feedbacks] = await Promise.all([
    prisma.orderItem.findMany({
      where: { order: { orderStatus: 'delivered' } },
      include: { product: { include: { category: true } } },
    }),
    prisma.feedback.findMany({
      where: { isApproved: true },
      include: { product: { select: { categoryId: true } } },
    }),
  ]);

  const categoryData: Record<string, { revenue: number; unitsSold: number }> = {};
  for (const item of orderItems) {
    const categoryName = item.product?.category?.categoryName || 'Uncategorized';
    if (!categoryData[categoryName]) categoryData[categoryName] = { revenue: 0, unitsSold: 0 };
    categoryData[categoryName].revenue += item.total || item.price * item.quantity;
    categoryData[categoryName].unitsSold += item.quantity;
  }

  const categoryIdToName = new Map<number, string>();
  for (const item of orderItems) {
    if (item.product?.categoryId != null && item.product.category?.categoryName) {
      categoryIdToName.set(item.product.categoryId, item.product.category.categoryName);
    }
  }

  const ratingSums: Record<string, { sum: number; count: number }> = {};
  for (const fb of feedbacks) {
    const categoryId = fb.product?.categoryId;
    const categoryName = categoryId != null ? categoryIdToName.get(categoryId) : undefined;
    if (!categoryName) continue;
    if (!ratingSums[categoryName]) ratingSums[categoryName] = { sum: 0, count: 0 };
    ratingSums[categoryName].sum += fb.rating;
    ratingSums[categoryName].count++;
  }

  return Object.entries(categoryData)
    .map(([category, v]) => ({
      category,
      revenue: Number(v.revenue.toFixed(2)),
      units_sold: v.unitsSold,
      avg_rating: ratingSums[category] ? Number((ratingSums[category].sum / ratingSums[category].count).toFixed(1)) : null,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getCatalogInsights(days: number = 30) {
  const [inventory, categoryPerformance] = await Promise.all([
    getInventoryHealth(days),
    getCategoryPerformance(),
  ]);
  return { inventory, category_performance: categoryPerformance };
}

// ─── Engagement: reviews + offers ────────────────────────────────

async function getReviewInsights() {
  const [approvedFeedbacks, pendingApprovalCount] = await Promise.all([
    prisma.feedback.findMany({ where: { isApproved: true }, select: { rating: true } }),
    prisma.feedback.count({ where: { isApproved: false } }),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const fb of approvedFeedbacks) {
    if (distribution[fb.rating] !== undefined) distribution[fb.rating]++;
    sum += fb.rating;
  }

  return {
    avg_rating: approvedFeedbacks.length > 0 ? Number((sum / approvedFeedbacks.length).toFixed(1)) : 0,
    total_reviews: approvedFeedbacks.length,
    rating_distribution: distribution,
    pending_approval_count: pendingApprovalCount,
  };
}

async function getOfferInsights(days: number = 30) {
  const now = new Date();
  const { startDate } = getDateRange(days);

  const activeOffers = await prisma.offer.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    include: { category: { select: { categoryName: true } }, product: { select: { productName: true } } },
    orderBy: { endDate: 'asc' },
  });

  const offeredProductIds = new Set<number>();
  const offeredCategoryIds = new Set<number>();
  for (const offer of activeOffers) {
    if (offer.productId) offeredProductIds.add(offer.productId);
    if (offer.categoryId) offeredCategoryIds.add(offer.categoryId);
  }

  let revenueFromOfferedProducts = 0;
  let offeredProductsCount = offeredProductIds.size;

  if (offeredProductIds.size > 0 || offeredCategoryIds.size > 0) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: startDate }, orderStatus: 'delivered' },
        product: {
          OR: [
            { id: { in: Array.from(offeredProductIds) } },
            { categoryId: { in: Array.from(offeredCategoryIds) } },
          ],
        },
      },
      select: { total: true, price: true, quantity: true, productId: true },
    });
    const distinctProducts = new Set(orderItems.map((i) => i.productId));
    offeredProductsCount = distinctProducts.size;
    revenueFromOfferedProducts = orderItems.reduce((sum, i) => sum + (i.total || i.price * i.quantity), 0);
  }

  return {
    active_offers: activeOffers.map((o) => ({
      id: o.id,
      offer_name: o.offerName,
      category: o.category?.categoryName || null,
      product: o.product?.productName || null,
      offer_percentage: o.offerPercentage,
      start_date: o.startDate,
      end_date: o.endDate,
    })),
    revenue_from_offered_products: Number(revenueFromOfferedProducts.toFixed(2)),
    offered_products_count: offeredProductsCount,
  };
}

export async function getEngagementInsights(days: number = 30) {
  const [reviews, offers] = await Promise.all([
    getReviewInsights(),
    getOfferInsights(days),
  ]);
  return { reviews, offers };
}