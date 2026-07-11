export const orderSchemas = {
  createOrder: {
    body: {
      type: 'object',
      required: ['shippingAddress', 'items'],
      properties: {
        customer: { type: 'number' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        contactNumber: { type: 'string' },
        secondaryNumber: { type: 'string' },
        preferredCourierService: { type: 'string' },
        courierNumber: { type: 'string' },
        paymentMethod: { type: 'string', enum: ['cod', 'online'], default: 'cod' },
        paymentStatus: { type: 'string', enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
        shippingAddress: { type: 'string' },
        billingAddress: { type: 'string' },
        tax: { type: 'number' },
        shippingCost: { type: 'number' },
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['product', 'quantity', 'price', 'total'],
            properties: {
              product: { type: 'number' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              tax: { type: 'number' },
              total: { type: 'number' },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },

  updateOrder: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
    body: {
      type: 'object',
      properties: {
        customer: { type: 'number' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        contactNumber: { type: 'string' },
        secondaryNumber: { type: 'string' },
        preferredCourierService: { type: 'string' },
        courierNumber: { type: 'string' },
        paymentMethod: { type: 'string', enum: ['cod', 'online'] },
        paymentStatus: { type: 'string', enum: ['pending', 'success', 'failed', 'refunded'] },
        shippingAddress: { type: 'string' },
        billingAddress: { type: 'string' },
        tax: { type: 'number' },
        shippingCost: { type: 'number' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['product', 'quantity', 'price', 'total'],
            properties: {
              product: { type: 'number' },
              quantity: { type: 'number' },
              price: { type: 'number' },
              tax: { type: 'number' },
              total: { type: 'number' },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },

  getOrderById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
  },

  deleteOrder: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
  },

  updateOrderStatus: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
    body: {
      type: 'object',
      required: ['order_status'],
      properties: {
        order_status: {
          type: 'string',
          enum: ['pending', 'order_confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
        },
        courier_number: { type: 'string' },
      },
      additionalProperties: false,
    },
  },

  getUnprintedOrders: {
    querystring: {
      type: 'object',
      properties: {
        from_date: { type: 'string', format: 'date-time' },
        to_date: { type: 'string', format: 'date-time' },
      },
      additionalProperties: false,
    },
  },

  checkoutInitiate: {
    body: {
      type: 'object',
      required: ['cart'],
      properties: {
        user_id: { type: 'number' },
        cart: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['product_id'],
            properties: {
              product_id: { type: 'number' },
              qty: { type: 'number', default: 1 },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },

  checkoutValidate: {
    body: {
      type: 'object',
      properties: {
        user_id: { type: 'number' },
      },
      additionalProperties: false,
    },
  },

  downloadInvoicePdf: {
    params: {
      type: 'object',
      required: ['orderId'],
      properties: {
        orderId: { type: 'string' },
      },
    },
  },

  batchAddressLabels: {
    body: {
      type: 'object',
      required: ['order_ids'],
      properties: {
        order_ids: {
          type: 'array',
          items: { type: 'number' },
          minItems: 1,
        },
      },
      additionalProperties: false,
    },
  },

  singleAddressLabel: {
    body: {
      type: 'object',
      required: ['order_id'],
      properties: {
        order_id: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
};
