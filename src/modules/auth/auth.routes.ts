import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as authController from './auth.controller';
import { authSchemas } from './auth.schema';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/customer/login/', { schema: authSchemas.customerLogin }, authController.customerLogin);
  app.post('/register/email-step1/', { schema: authSchemas.registerEmailStep1 }, authController.registerEmailStep1);
  app.post('/register/email-step2/', { schema: authSchemas.registerEmailStep2 }, authController.registerEmailStep2);
  app.post('/phone-register-step1/', { schema: authSchemas.phoneRegisterStep1 }, authController.phoneRegisterStep1);
  app.post('/phone-register-step2/', { schema: authSchemas.phoneRegisterStep2 }, authController.phoneRegisterStep2);
  app.post('/phone-login-step1/', { schema: authSchemas.phoneLoginStep1 }, authController.phoneLoginStep1);
  app.post('/phone-login-step2/', { schema: authSchemas.phoneLoginStep2 }, authController.phoneLoginStep2);
  app.post('/google/', { schema: authSchemas.googleAuth }, authController.googleAuth);
  app.post('/frontend-auth-log/', { schema: authSchemas.frontendAuthLog }, authController.frontendAuthLog);
  app.post('/adminlogin/', { schema: authSchemas.adminLogin }, authController.adminLogin);
  app.post('/verifyloginotp/', { schema: authSchemas.verifyLoginOtp }, authController.verifyLoginOtp);
  app.post('/dashboard-tool/send-otp/', { preHandler: [authenticate, requireAdmin] }, authController.sendDashboardToolOtp);
  app.post('/dashboard-tool/verify-otp/', { schema: authSchemas.verifyDashboardToolOtp, preHandler: [authenticate, requireAdmin] }, authController.verifyDashboardToolOtp);
  app.post('/logout/', { schema: authSchemas.logout, preHandler: [authenticate] }, authController.logout);
  app.post('/token/refresh/', { schema: authSchemas.refreshToken }, authController.refreshToken);
  app.post('/forgot-password/', { schema: authSchemas.forgotPassword }, authController.forgotPassword);
  app.post('/forgot-password-customer/', { schema: authSchemas.forgotPasswordCustomer }, authController.forgotPasswordCustomer);
  app.post('/set-password/', { schema: authSchemas.setPassword }, authController.setPassword);

  // NEW FLOW: Register with email/password + login_method, then OTP login
  // app.post('/register/email-method/', { schema: authSchemas.registerEmailMethod }, authController.registerWithEmailAndMethod);
  // app.post('/register/google-method/', { schema: authSchemas.registerGoogleMethod }, authController.registerWithGoogleAndMethod);
  // app.post('/verify-login-otp-customer/', { schema: authSchemas.verifyLoginOtpCustomer }, authController.verifyLoginOtpCustomer);
}
