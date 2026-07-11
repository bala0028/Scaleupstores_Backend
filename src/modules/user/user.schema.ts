export const userSchemas = {
  updateCustomerDetails: {
    body: {
      type: 'object',
      properties: {
        full_name: { type: 'string' },
        address: { type: 'string' },
        dob: { type: 'string' },
        gender: { type: 'string', enum: ['male', 'female', 'other'] },
      },
    },
  },

  updateCustomerDetailsById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    body: {
      type: 'object',
      properties: {
        full_name: { type: 'string' },
        address: { type: 'string' },
        dob: { type: 'string' },
        gender: { type: 'string', enum: ['male', 'female', 'other'] },
      },
    },
  },

  getCustomerById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  createAdmin: {
    body: {
      type: 'object',
      required: ['full_name', 'email', 'password'],
      properties: {
        full_name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
      },
    },
  },

  getAdminById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },

  updateAdmin: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    body: {
      type: 'object',
      properties: {
        full_name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
      },
    },
  },

  deleteAdmin: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
};
