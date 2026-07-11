export const notificationSchemas = {
  listNotifications: {
    params: {
      type: 'object',
      required: ['customer_id'],
      properties: { customer_id: { type: 'string' } },
    },
  },

  markAsRead: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  markAllAsRead: {
    params: {
      type: 'object',
      required: ['customer_id'],
      properties: { customer_id: { type: 'string' } },
    },
  },

  deleteNotification: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  clearAllNotifications: {
    params: {
      type: 'object',
      required: ['customer_id'],
      properties: { customer_id: { type: 'string' } },
    },
  },

  requestStockNotification: {
    body: {
      type: 'object',
      required: ['product_id'],
      properties: {
        product_id: { type: 'number' },
        user_id: { type: 'number' },
      },
    },
  },
};
