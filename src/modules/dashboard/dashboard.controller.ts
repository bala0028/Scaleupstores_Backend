import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendServerError } from '../../utils/response';
import * as dashboardService from './dashboard.service';
import { DashboardQuery } from './dashboard.schema';

export async function getDashboardSummary(request: FastifyRequest<{ Querystring: DashboardQuery }>, reply: FastifyReply) {
  try {
    const data = await dashboardService.getDashboardSummary();
    return sendSuccess(reply, data, 'Dashboard summary fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getSalesChart(request: FastifyRequest<{ Querystring: { days?: number } }>, reply: FastifyReply) {
  try {
    const days = request.query.days || 30;
    const data = await dashboardService.getSalesChart(days);
    return sendSuccess(reply, data, 'Sales chart data fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getOrdersByStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await dashboardService.getOrdersByStatus();
    return sendSuccess(reply, data, 'Orders by status fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getTopProducts(request: FastifyRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply) {
  try {
    const limit = request.query.limit || 10;
    const data = await dashboardService.getTopProducts(limit);
    return sendSuccess(reply, data, 'Top products fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCustomerGrowth(request: FastifyRequest<{ Querystring: { months?: number } }>, reply: FastifyReply) {
  try {
    const months = request.query.months || 12;
    const data = await dashboardService.getCustomerGrowth(months);
    return sendSuccess(reply, data, 'Customer growth data fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCategoryRevenue(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await dashboardService.getCategoryRevenue();
    return sendSuccess(reply, data, 'Category revenue data fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getHourlySales(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await dashboardService.getHourlySales();
    return sendSuccess(reply, data, 'Hourly sales data fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getDayOfWeekSales(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await dashboardService.getDayOfWeekSales();
    return sendSuccess(reply, data, 'Day of week sales data fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getTopCustomers(request: FastifyRequest<{ Querystring: { limit?: number } }>, reply: FastifyReply) {
  try {
    const limit = request.query.limit || 10;
    const data = await dashboardService.getTopCustomers(limit);
    return sendSuccess(reply, data, 'Top customers fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getLowStockAlerts(request: FastifyRequest<{ Querystring: { threshold?: number } }>, reply: FastifyReply) {
  try {
    const threshold = request.query.threshold || 5;
    const data = await dashboardService.getLowStockAlerts(threshold);
    return sendSuccess(reply, data, 'Low stock alerts fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getAttentionItems(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await dashboardService.getAttentionItems();
    return sendSuccess(reply, data, 'Attention items fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getOperationsInsights(request: FastifyRequest<{ Querystring: { days?: number } }>, reply: FastifyReply) {
  try {
    const days = request.query.days || 30;
    const data = await dashboardService.getOperationsInsights(days);
    return sendSuccess(reply, data, 'Operations insights fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCatalogInsights(request: FastifyRequest<{ Querystring: { days?: number } }>, reply: FastifyReply) {
  try {
    const days = request.query.days || 30;
    const data = await dashboardService.getCatalogInsights(days);
    return sendSuccess(reply, data, 'Catalog insights fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getEngagementInsights(request: FastifyRequest<{ Querystring: { days?: number } }>, reply: FastifyReply) {
  try {
    const days = request.query.days || 30;
    const data = await dashboardService.getEngagementInsights(days);
    return sendSuccess(reply, data, 'Engagement insights fetched successfully');
  } catch (error) {
    return sendServerError(reply, error);
  }
}