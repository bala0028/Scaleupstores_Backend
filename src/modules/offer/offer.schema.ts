export const offerSchemas = {
  createOffer: {
    body: {
      type: 'object',
      required: ['offerName', 'startDate', 'endDate'],
      properties: {
        categoryId: { type: ['number', 'null'] },
        productId: { type: ['number', 'null'] },
        offerName: { type: 'string' },
        offerPercentage: { type: 'number', minimum: 1, maximum: 100 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
      },
    },
  },

  getOfferById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  updateOffer: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    body: {
      type: 'object',
      properties: {
        categoryId: { type: 'number' },
        productId: { type: 'number' },
        offerName: { type: 'string' },
        offerPercentage: { type: 'number', minimum: 1, maximum: 100 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
      },
    },
  },

  deleteOffer: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  getProductsByCategory: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
};
