export const productSchemas = {
  // ── Product ──────────────────────────────────────────────
  createProduct: {
    body: {
      type: 'object',
      required: ['product_name', 'price'],
      properties: {
        product_name: { type: 'string' },
        product_description: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'number' },
        quantity_unit: { type: 'string' },
        category_id: { type: 'number' },
        stock_quantity: { type: 'number' },
        image: { type: 'string' },
      },
    },
  },

  updateProduct: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    body: {
      type: 'object',
      properties: {
        product_name: { type: 'string' },
        product_description: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'number' },
        quantity_unit: { type: 'string' },
        category_id: { type: 'number' },
        stock_quantity: { type: 'number' },
        image: { type: 'string' },
      },
    },
  },

  getProductById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  deleteProduct: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  // ── Public ───────────────────────────────────────────────
  listProductsPublic: {
    querystring: {
      type: 'object',
      properties: {
        offer_only: { type: 'string', enum: ['true', 'false'] },
      },
    },
  },

  getProductDetailsPublic: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  checkStock: {
    querystring: {
      type: 'object',
      required: ['product_id'],
      properties: { product_id: { type: 'string' } },
    },
  },

  filterByCategory: {
    params: {
      type: 'object',
      required: ['catId'],
      properties: { catId: { type: 'string' } },
    },
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'string' },
        page_size: { type: 'string' },
      },
    },
  },

  // ── Variant ──────────────────────────────────────────────
  createVariant: {
    body: {
      type: 'object',
      required: ['parent', 'product_name', 'price'],
      properties: {
        parent: { type: 'number' },
        product_name: { type: 'string' },
        product_description: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'number' },
        quantity_unit: { type: 'string' },
        stock_quantity: { type: 'number' },
        image: { type: 'string' },
      },
    },
  },

  updateVariant: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    body: {
      type: 'object',
      properties: {
        parent: { type: 'number' },
        product_name: { type: 'string' },
        product_description: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'number' },
        quantity_unit: { type: 'string' },
        stock_quantity: { type: 'number' },
        image: { type: 'string' },
      },
    },
  },

  getVariantById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  deleteVariant: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  filterVariants: {
    querystring: {
      type: 'object',
      required: ['parent_id'],
      properties: { parent_id: { type: 'string' } },
    },
  },

  // ── Feedback ─────────────────────────────────────────────
  addOrUpdateFeedback: {
    params: {
      type: 'object',
      required: ['productId'],
      properties: { productId: { type: 'string' } },
    },
    body: {
      type: 'object',
      required: ['rating'],
      properties: {
        rating: { type: 'number', minimum: 1, maximum: 5 },
        comment: { type: 'string' },
      },
    },
  },

  getApprovedFeedbackList: {
    params: {
      type: 'object',
      required: ['productId'],
      properties: { productId: { type: 'string' } },
    },
  },

  getRatingSummary: {
    params: {
      type: 'object',
      required: ['productId'],
      properties: { productId: { type: 'string' } },
    },
  },

  filterFeedbackByRating: {
    params: {
      type: 'object',
      required: ['productId'],
      properties: { productId: { type: 'string' } },
    },
    querystring: {
      type: 'object',
      properties: {
        rating: { type: 'string' },
        page: { type: 'string' },
        page_size: { type: 'string' },
      },
    },
  },

  adminFeedbackList: {
    querystring: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        category_id: { type: 'string' },
        rating: { type: 'string' },
        ordering: { type: 'string' },
        page: { type: 'string' },
        page_size: { type: 'string' },
      },
    },
  },

  adminApproval: {
    params: {
      type: 'object',
      required: ['reviewId'],
      properties: { reviewId: { type: 'string' } },
    },
    body: {
      type: 'object',
      required: ['action'],
      properties: {
        action: { type: 'string', enum: ['approve', 'reject'] },
      },
    },
  },

  getAdminFeedbackDetail: {
    params: {
      type: 'object',
      required: ['reviewId'],
      properties: { reviewId: { type: 'string' } },
    },
  },

  deleteAdminFeedback: {
    params: {
      type: 'object',
      required: ['reviewId'],
      properties: { reviewId: { type: 'string' } },
    },
  },

  // ── Favorites ────────────────────────────────────────────
  toggleFavorite: {
    body: {
      type: 'object',
      required: ['product_id'],
      properties: {
        product_id: { type: 'number' },
      },
    },
  },

  getFavorites: {
    querystring: {
      type: 'object',
      properties: {},
    },
  },

  getFavoriteIds: {
    querystring: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
      },
    },
  },

  // ── Global Search ────────────────────────────────────────
  globalProductSearch: {
    querystring: {
      type: 'object',
      required: ['search'],
      properties: { search: { type: 'string' } },
    },
  },

  globalOrderSearch: {
    querystring: {
      type: 'object',
      required: ['order_id'],
      properties: { order_id: { type: 'string' } },
    },
  },
};
