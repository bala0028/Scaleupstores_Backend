const orderDataSchema = {
  type: 'object',
  required: ['shippingAddress', 'items'],
  properties: {
    customer: { type: 'number' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    contactNumber: { type: 'string' },
    secondaryNumber: { type: 'string' },
    shippingAddress: { type: 'string' },
    billingAddress: { type: 'string' },
    state: { type: 'string' },
    subtotal: { type: 'number' },
    tax: { type: 'number' },
    shippingCost: { type: 'number' },
    totalAmount: { type: 'number' },
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
      },
    },
  },
};

export const paymentSchemas = {
  reserveOrder: {
    body: {
      type: 'object',
      required: ['items', 'payment_method', 'order_data'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['product', 'quantity'],
            properties: {
              product: { type: 'number' },
              quantity: { type: 'number' },
            },
          },
        },
        payment_method: { type: 'string', enum: ['online', 'cod'] },
        order_data: orderDataSchema,
      },
    },
  },

  verifyPayment: {
    body: {
      type: 'object',
      required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'order_data'],
      properties: {
        razorpay_order_id: { type: 'string' },
        razorpay_payment_id: { type: 'string' },
        razorpay_signature: { type: 'string' },
        order_data: orderDataSchema,
      },
    },
  },

  getPaymentStatus: {
    params: {
      type: 'object',
      required: ['razorpayOrderId'],
      properties: {
        razorpayOrderId: { type: 'string' },
      },
    },
  },

  logFrontendEvent: {
    body: {
      type: 'object',
      required: ['razorpay_order_id', 'event_type'],
      properties: {
        razorpay_order_id: { type: 'string' },
        event_type: { type: 'string' },
        error_details: { type: 'object' },
      },
    },
  },

  getOrderTracking: {
    params: {
      type: 'object',
      required: ['orderNumber'],
      properties: {
        orderNumber: { type: 'string' },
      },
    },
  },

  getOrderHistory: {
    params: {
      type: 'object',
      required: ['customerId'],
      properties: {
        customerId: { type: 'string' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'string' },
        page_size: { type: 'string' },
      },
    },
  },

  updateGstSetting: {
    body: {
      type: 'object',
      required: ['gst_percentage'],
      properties: {
        gst_percentage: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
  },

  updateCourierChargeSetting: {
    body: {
      type: 'object',
      required: ['courier_charge'],
      properties: {
        courier_charge: { type: 'number' },
      },
    },
  },

  updateDashboardSectionVisibility: {
    body: {
      type: 'object',
      properties: {
        needsAttention: { type: 'boolean' },
        sales: { type: 'boolean' },
        fulfillment: { type: 'boolean' },
        inventory: { type: 'boolean' },
        customers: { type: 'boolean' },
      },
    },
  },
};
