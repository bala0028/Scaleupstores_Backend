export const categorySchemas = {
  createCategory: {
    body: {
      type: 'object',
      required: ['categoryName'],
      properties: {
        categoryName: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string' },
      },
    },
  },

  getCategoryById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  updateCategory: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    body: {
      type: 'object',
      properties: {
        categoryName: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string' },
      },
    },
  },

  deleteCategory: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
};
