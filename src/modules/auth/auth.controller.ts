import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError, sendServerError, sendNotFound } from '../../utils/response';
import { sendPasswordResetEmail } from '../../services/emailService';
import { env } from '../../config/env';
import prisma from '../../config/db';
import * as authService from './auth.service';

export async function customerLogin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body as { email: string; password: string };
    const tokens = await authService.loginCustomer(email, password);
    return sendSuccess(reply, tokens, 'Login successful');
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return sendError(reply, error.message, 401);
    }
    return sendServerError(reply, error);
  }
}

export async function registerEmailStep1(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email } = request.body as { email: string };
    const result = await authService.registerEmailStep1(email);
    return sendSuccess(reply, result, 'OTP sent to email');
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return sendError(reply, error.message, 409);
    }
    return sendServerError(reply, error);
  }
}

export async function registerEmailStep2(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { session_id, otp, password } = request.body as { session_id: string; otp: string; password: string };
    const tokens = await authService.registerEmailStep2(session_id, otp, password);
    return sendSuccess(reply, tokens, 'Registration successful');
  } catch (error: any) {
    if (['Invalid session', 'OTP expired', 'Invalid OTP', 'Session has no email'].includes(error.message)) {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function phoneRegisterStep1(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { phone } = request.body as { phone: string };
    const result = await authService.phoneRegisterStep1(phone);
    return sendSuccess(reply, result, 'OTP sent to phone');
  } catch (error: any) {
    if (error.message === 'Phone already registered') {
      return sendError(reply, error.message, 409);
    }
    return sendServerError(reply, error);
  }
}

export async function phoneRegisterStep2(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { session_id, otp } = request.body as { session_id: string; otp: string };
    const tokens = await authService.phoneRegisterStep2(session_id, otp);
    return sendSuccess(reply, tokens, 'Registration successful');
  } catch (error: any) {
    if (['Invalid session', 'OTP expired', 'Invalid OTP', 'Session has no phone'].includes(error.message)) {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function phoneLoginStep1(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { phone } = request.body as { phone: string };
    const result = await authService.phoneLoginStep1(phone);
    return sendSuccess(reply, result, 'OTP sent to phone');
  } catch (error: any) {
    if (error.message === 'Phone not registered') {
      return sendNotFound(reply, error.message);
    }
    return sendServerError(reply, error);
  }
}

export async function phoneLoginStep2(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { session_id, otp } = request.body as { session_id: string; otp: string };
    const tokens = await authService.phoneLoginStep2(session_id, otp);
    return sendSuccess(reply, tokens, 'Login successful');
  } catch (error: any) {
    if (['Invalid session', 'OTP expired', 'Invalid OTP', 'Session has no phone', 'Customer not found'].includes(error.message)) {
      if (error.message === 'Customer not found') {
        return sendNotFound(reply, error.message);
      }
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function googleAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { token } = request.body as { token: string };
    const tokens = await authService.googleAuth(token);
    return sendSuccess(reply, tokens, 'Google login successful');
  } catch (error: any) {
    if (error.message === 'Invalid Google token') {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function frontendAuthLog(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = request.body;
    await prisma.frontendAuthLog.create({ data: { data: data as any } });
    return sendSuccess(reply, null, 'Logged');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function adminLogin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body as { email: string; password: string };
    const result = await authService.adminLogin(email, password);
    return sendSuccess(reply, result, 'Login successful');
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      return sendError(reply, error.message, 401);
    }
    return sendServerError(reply, error);
  }
}

export async function verifyLoginOtp(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { session_id, otp } = request.body as { session_id: string; otp: string };
    const result = await authService.verifyLoginOtp(session_id, otp);
    return sendSuccess(reply, result, 'Login successful');
  } catch (error: any) {
    if (['Invalid session', 'OTP expired', 'Invalid OTP', 'Session has no email', 'Admin not found'].includes(error.message)) {
      if (error.message === 'Admin not found') {
        return sendNotFound(reply, error.message);
      }
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function sendDashboardToolOtp(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await authService.sendDashboardToolOtp();
    return sendSuccess(reply, result, 'OTP sent');
  } catch (error: any) {
    if (error.message?.startsWith('Too many OTP requests')) {
      return sendError(reply, error.message, 429);
    }
    return sendServerError(reply, error);
  }
}

export async function verifyDashboardToolOtp(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { session_id, otp } = request.body as { session_id: string; otp: string };
    const result = await authService.verifyDashboardToolOtp(session_id, otp);
    return sendSuccess(reply, result, 'OTP verified');
  } catch (error: any) {
    if (['Invalid session', 'OTP expired', 'Invalid OTP', 'Invalid session type'].includes(error.message)) {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

export async function logout(_request: FastifyRequest, reply: FastifyReply) {
  return sendSuccess(reply, null, 'Logged out');
}

export async function refreshToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { refresh } = request.body as { refresh: string };
    const tokens = await authService.refreshToken(refresh);
    return sendSuccess(reply, tokens, 'Token refreshed');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email } = request.body as { email: string };
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return sendNotFound(reply, 'Admin not found');
    }
    const token = uuidv4();
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        adminId: admin.id,
        isAdmin: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);
    return sendSuccess(reply, null, 'Password reset email sent');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function forgotPasswordCustomer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email } = request.body as { email: string };
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return sendNotFound(reply, 'Customer not found');
    }
    const token = uuidv4();
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        isAdmin: false,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);
    return sendSuccess(reply, null, 'Password reset email sent');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function setPassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { token, password } = request.body as { token: string; password: string };
    await authService.setPassword(token, password);
    return sendSuccess(reply, null, 'Password reset successful');
  } catch (error: any) {
    if (['Invalid or expired token', 'Token already used', 'Token expired'].includes(error.message)) {
      return sendError(reply, error.message, 400);
    }
    return sendServerError(reply, error);
  }
}

// NEW FLOW: Register with email/password + login_method
// export async function registerWithEmailAndMethod(request: FastifyRequest, reply: FastifyReply) {
//   try {
//     const { email, password, login_method } = request.body as { email: string; password: string; login_method: string };
//     const result = await authService.registerWithEmailAndMethod({ email, password, loginMethod: login_method || 'email' });
//     return sendSuccess(reply, result, 'Registration successful. OTP sent to email for login verification.');
//   } catch (error: any) {
//     if (error.message === 'Email already registered') {
//       return sendError(reply, error.message, 409);
//     }
//     return sendServerError(reply, error);
//   }
// }

// NEW FLOW: Register with Google + login_method
// export async function registerWithGoogleAndMethod(request: FastifyRequest, reply: FastifyReply) {
//   try {
//     const { token, login_method } = request.body as { token: string; login_method: string };
//     const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
//     const googleId = decoded.sub || decoded.googleId;
//     const email = decoded.email || null;
//     if (!googleId) {
//       return sendError(reply, 'Invalid Google token', 400);
//     }
//     const result = await authService.registerWithGoogleAndMethod({ googleId, email, loginMethod: login_method || 'google' });
//     return sendSuccess(reply, result, 'Google registration successful. OTP sent to email for login verification.');
//   } catch (error: any) {
//     if (error.message === 'Invalid Google token') {
//       return sendError(reply, error.message, 400);
//     }
//     return sendServerError(reply, error);
//   }
// }

// NEW FLOW: Verify OTP for login after registration
// export async function verifyLoginOtpCustomer(request: FastifyRequest, reply: FastifyReply) {
//   try {
//     const { session_id, otp } = request.body as { session_id: string; otp: string };
//     const tokens = await authService.verifyLoginOtpCustomer(session_id, otp);
//     return sendSuccess(reply, tokens, 'Login successful');
//   } catch (error: any) {
//     if (['Invalid session', 'OTP expired', 'Invalid OTP', 'Session has no email', 'Customer not found'].includes(error.message)) {
//       if (error.message === 'Customer not found') {
//         return sendNotFound(reply, error.message);
//       }
//       return sendError(reply, error.message, 400);
//     }
//     return sendServerError(reply, error);
//   }
// }
