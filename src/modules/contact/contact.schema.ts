export const contactSchemas = {
  createContactMessage: {
    body: {
      type: 'object',
      required: ['name', 'email', 'phone', 'message'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },

  getContactMessageById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  deleteContactMessage: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
};
