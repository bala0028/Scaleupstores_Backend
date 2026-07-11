export const authSchemas = {
  customerLogin: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 1 },
      },
    },
  },

  registerEmailStep1: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
      },
    },
  },

  registerEmailStep2: {
    body: {
      type: 'object',
      required: ['session_id', 'otp', 'password'],
      properties: {
        session_id: { type: 'string', format: 'uuid' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
        password: { type: 'string', minLength: 6 },
      },
    },
  },

  phoneRegisterStep1: {
    body: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: { type: 'string', minLength: 10, maxLength: 15 },
      },
    },
  },

  phoneRegisterStep2: {
    body: {
      type: 'object',
      required: ['session_id', 'otp'],
      properties: {
        session_id: { type: 'string', format: 'uuid' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
      },
    },
  },

  phoneLoginStep1: {
    body: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: { type: 'string', minLength: 10, maxLength: 15 },
      },
    },
  },

  phoneLoginStep2: {
    body: {
      type: 'object',
      required: ['session_id', 'otp'],
      properties: {
        session_id: { type: 'string', format: 'uuid' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
      },
    },
  },

  googleAuth: {
    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' },
      },
    },
  },

  adminLogin: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
  },

  verifyLoginOtp: {
    body: {
      type: 'object',
      required: ['session_id', 'otp'],
      properties: {
        session_id: { type: 'string', format: 'uuid' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
      },
    },
  },

  verifyDashboardToolOtp: {
    body: {
      type: 'object',
      required: ['session_id', 'otp'],
      properties: {
        session_id: { type: 'string', format: 'uuid' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
      },
    },
  },

  logout: {
    body: {
      type: 'object',
      required: ['refresh'],
      properties: {
        refresh: { type: 'string' },
      },
    },
  },

  refreshToken: {
    body: {
      type: 'object',
      required: ['refresh'],
      properties: {
        refresh: { type: 'string' },
      },
    },
  },

  forgotPassword: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
      },
    },
  },

  forgotPasswordCustomer: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
      },
    },
  },

  setPassword: {
    body: {
      type: 'object',
      required: ['password', 'token'],
      properties: {
        password: { type: 'string', minLength: 6 },
        token: { type: 'string' },
      },
    },
  },

  frontendAuthLog: {
    body: {
      type: 'object',
    },
  },

  // NEW FLOW: Register with email/password + login_method
  registerEmailMethod: {
    body: {
      type: 'object',
      required: ['email', 'password', 'login_method'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        login_method: { type: 'string', enum: ['email', 'google', 'phone'] },
      },
    },
  },

  // NEW FLOW: Register with Google + login_method
  registerGoogleMethod: {
    body: {
      type: 'object',
      required: ['token', 'login_method'],
      properties: {
        token: { type: 'string' },
        login_method: { type: 'string', enum: ['email', 'google', 'phone'] },
      },
    },
  },

  // NEW FLOW: Verify OTP for login after registration
  verifyLoginOtpCustomer: {
    body: {
      type: 'object',
      required: ['session_id', 'otp'],
      properties: {
        session_id: { type: 'string', format: 'uuid' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
      },
    },
  },
};
