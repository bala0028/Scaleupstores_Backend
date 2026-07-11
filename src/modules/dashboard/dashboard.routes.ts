import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as dashboardController from './dashboard.controller';
import { dashboardSchemas } from './dashboard.schema';

export default async function dashboardRoutes(app: FastifyInstance) {
  const prefix = '/api';
  const auth = [authenticate, requireAdmin];

  app.get('/dashboard/summary', { schema: dashboardSchemas.summary, preHandler: auth }, dashboardController.getDashboardSummary);
  app.get('/dashboard/sales-chart', { schema: dashboardSchemas.salesChart, preHandler: auth }, dashboardController.getSalesChart);
  app.get('/dashboard/orders-by-status', { schema: dashboardSchemas.ordersByStatus, preHandler: auth }, dashboardController.getOrdersByStatus);
  app.get('/dashboard/top-products', { schema: dashboardSchemas.topProducts, preHandler: auth }, dashboardController.getTopProducts);
  app.get('/dashboard/customer-growth', { schema: dashboardSchemas.customerGrowth, preHandler: auth }, dashboardController.getCustomerGrowth);
  app.get('/dashboard/category-revenue', { schema: dashboardSchemas.categoryRevenue, preHandler: auth }, dashboardController.getCategoryRevenue);
  app.get('/dashboard/hourly-sales', { schema: dashboardSchemas.hourlySales, preHandler: auth }, dashboardController.getHourlySales);
  app.get('/dashboard/day-of-week-sales', { schema: dashboardSchemas.dayOfWeekSales, preHandler: auth }, dashboardController.getDayOfWeekSales);
  app.get('/dashboard/top-customers', { schema: dashboardSchemas.topCustomers, preHandler: auth }, dashboardController.getTopCustomers);
  app.get('/dashboard/low-stock-alerts', { schema: dashboardSchemas.lowStockAlerts, preHandler: auth }, dashboardController.getLowStockAlerts);
  app.get('/dashboard/attention', { preHandler: auth }, dashboardController.getAttentionItems);
  app.get('/dashboard/operations-insights', { preHandler: auth }, dashboardController.getOperationsInsights);
  app.get('/dashboard/catalog-insights', { preHandler: auth }, dashboardController.getCatalogInsights);
  app.get('/dashboard/engagement-insights', { preHandler: auth }, dashboardController.getEngagementInsights);
}