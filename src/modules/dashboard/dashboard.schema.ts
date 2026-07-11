import { Type, Static } from '@fastify/type-provider-typebox';

export const dashboardQuerySchema = Type.Object({
  days: Type.Optional(Type.Integer({ minimum: 1, maximum: 365, default: 30 })),
  months: Type.Optional(Type.Integer({ minimum: 1, maximum: 24, default: 12 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 10 })),
  threshold: Type.Optional(Type.Integer({ minimum: 0, maximum: 100, default: 5 })),
});

export type DashboardQuery = Static<typeof dashboardQuerySchema>;

export const dashboardSchemas = {
  summary: {
    query: dashboardQuerySchema,
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Object({
          total_customers: Type.Number(),
          total_products: Type.Number(),
          total_orders: Type.Number(),
          total_revenue: Type.Number(),
          recent_orders: Type.Array(Type.Object({
            id: Type.Number(),
            orderNumber: Type.Optional(Type.String()),
            order_number: Type.Optional(Type.String()),
            totalAmount: Type.Optional(Type.Number()),
            total_amount: Type.Optional(Type.Number()),
            orderStatus: Type.Optional(Type.String()),
            order_status: Type.Optional(Type.String()),
            createdAt: Type.Optional(Type.String()),
            created_at: Type.Optional(Type.String()),
            customer: Type.Optional(Type.Object({
              id: Type.Number(),
              fullName: Type.Optional(Type.String()),
              full_name: Type.Optional(Type.String()),
              email: Type.Optional(Type.String()),
            })),
          })),
          orders_by_status: Type.Record(Type.String(), Type.Number()),
          low_stock_products: Type.Array(Type.Object({
            id: Type.Number(),
            productName: Type.String(),
            product_name: Type.Optional(Type.String()),
            stockQuantity: Type.Number(),
            stock_quantity: Type.Optional(Type.Number()),
            image: Type.Optional(Type.String()),
          })),
          today_orders: Type.Number(),
          avg_order_value: Type.Number(),
          pending_orders: Type.Number(),
          low_stock_count: Type.Number(),
          new_customers_this_week: Type.Number(),
          new_customers_last_week: Type.Number(),
          revenue_today: Type.Number(),
          revenue_yesterday: Type.Number(),
          revenue_change_pct: Type.Number(),
        }),
      }),
    },
  },
  salesChart: {
    query: Type.Object({
      days: Type.Optional(Type.Integer({ minimum: 1, maximum: 365, default: 30 })),
    }),
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Object({
          chartData: Type.Array(Type.Object({
            date: Type.String(),
            sales: Type.Number(),
          })),
          peakDay: Type.Object({
            date: Type.String(),
            sales: Type.Number(),
          }),
        }),
      }),
    },
  },
  ordersByStatus: {
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          status: Type.String(),
          count: Type.Number(),
        })),
      }),
    },
  },
  topProducts: {
    query: Type.Object({
      limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 10 })),
    }),
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          product_id: Type.Number(),
          product_name: Type.String(),
          image: Type.Optional(Type.String()),
          price: Type.Number(),
          total_sold: Type.Number(),
          total_revenue: Type.Number(),
        })),
      }),
    },
  },
  customerGrowth: {
    query: Type.Object({
      months: Type.Optional(Type.Integer({ minimum: 1, maximum: 24, default: 12 })),
    }),
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          month: Type.String(),
          new_customers: Type.Number(),
          cumulative_customers: Type.Number(),
        })),
      }),
    },
  },
  categoryRevenue: {
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          category: Type.String(),
          revenue: Type.Number(),
        })),
      }),
    },
  },
  hourlySales: {
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          hour: Type.Number(),
          orders: Type.Number(),
          revenue: Type.Number(),
        })),
      }),
    },
  },
  dayOfWeekSales: {
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          day: Type.String(),
          dayIndex: Type.Number(),
          orders: Type.Number(),
          revenue: Type.Number(),
        })),
      }),
    },
  },
  topCustomers: {
    query: Type.Object({
      limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 10 })),
    }),
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          id: Type.Number(),
          name: Type.String(),
          email: Type.Optional(Type.String()),
          phone: Type.Optional(Type.String()),
          total_orders: Type.Number(),
          total_spent: Type.Number(),
        })),
      }),
    },
  },
  lowStockAlerts: {
    query: Type.Object({
      threshold: Type.Optional(Type.Integer({ minimum: 0, maximum: 100, default: 5 })),
    }),
    response: {
      200: Type.Object({
        status: Type.Boolean(),
        message: Type.String(),
        data: Type.Array(Type.Object({
          id: Type.Number(),
          product_name: Type.String(),
          stock_quantity: Type.Number(),
          image: Type.Optional(Type.String()),
          price: Type.Number(),
          is_critical: Type.Boolean(),
        })),
      }),
    },
  },
};