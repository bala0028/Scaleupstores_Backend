import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/db';
import { generateOtp } from '../../utils/otp';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt';
import { JwtPayload } from '../../types';
import { sendOtpEmail, sendPasswordResetEmail } from '../../services/emailService';
import { sendOtpSms } from '../../services/smsService';
import { env } from '../../config/env';

// Lazy-load firebase-admin to avoid startup crash if credentials are missing
let firebaseAdmin: any = null;
async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  try {
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default as any;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    firebaseAdmin = admin;
  } catch {
    // firebase-admin not installed or no credentials — fall back to unsafe decode (dev only)
    firebaseAdmin = null;
  }
  return firebaseAdmin;
}

function customerPayload(customer: { id: number; email: string | null }): JwtPayload {
  return { id: customer.id, email: customer.email ?? undefined, type: 'customer' };
}

function adminPayload(admin: { id: number; email: string }): JwtPayload {
  return { id: admin.id, email: admin.email, isAdmin: true, type: 'admin' };
}

/**
 * Production hardening helper: when we create a fresh OTP session for an
 * email/phone, we invalidate any previous unverified sessions for the same
 * identifier so the old OTP cannot be used to bypass the rate of delivery.
 * This matches how production auth flows (Firebase, AWS Cognito, Auth0) behave.
 */
async function invalidatePriorSessions(args: {
  email?: string;
  phone?: string;
  type?: string;
}) {
  const where: any = { isVerified: false };
  if (args.email) where.email = args.email;
  if (args.phone) where.phone = args.phone;
  if (args.type) where.type = args.type;
  // Only delete sessions created in the last 30 minutes (the OTP expiry window).
  where.createdAt = { gte: new Date(Date.now() - 30 * 60 * 1000) };
  try {
    await prisma.otpSession.deleteMany({ where });
  } catch (err) {
    // Don't fail the registration if cleanup fails — log and move on.
    console.warn('[auth] failed to invalidate prior OTP sessions:', err);
  }
}

/**
 * Lightweight per-identifier rate limiter. Keeps a 5-minute sliding window
 * in process memory. For multi-instance production deployments, swap this
 * for a Redis-backed counter (e.g. `@fastify/rate-limit` keyed by body).
 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const rateLimitBuckets = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const arr = (rateLimitBuckets.get(key) || []).filter((t) => t >= windowStart);
  if (arr.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, arr);
    return true;
  }
  arr.push(now);
  rateLimitBuckets.set(key, arr);
  return false;
}

export async function loginCustomer(email: string, password: string) {
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.password) {
    throw new Error('Invalid email or password');
  }
  if (!customer.isActive) {
    throw new Error('Account not verified. Please verify your email first.');
  }
  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }
  return generateTokenPair(customerPayload(customer));
}

export async function registerEmailStep1(email: string) {
  if (isRateLimited(`email-register:${email}`)) {
    throw new Error('Too many OTP requests. Please try again in a few minutes.');
  }
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }
  const otp = generateOtp();
  const sessionId = uuidv4();
  await invalidatePriorSessions({ email, type: 'email_register' });
  await prisma.otpSession.create({
    data: {
      id: sessionId,
      email,
      otp,
      type: 'email_register',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const emailResult = await sendOtpEmail(email, otp);
  if (!emailResult.ok) {
    await prisma.otpSession.delete({ where: { id: sessionId } }).catch(() => {});
    throw new Error(`Failed to send OTP email: ${emailResult.errorMessage || 'unknown'}`);
  }
  return { session_id: sessionId };
}

export async function registerEmailStep2(sessionId: string, otp: string, password: string) {
  const session = await prisma.otpSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Invalid session');
  if (new Date() > session.expiresAt) throw new Error('OTP expired');
  if (session.otp !== otp) throw new Error('Invalid OTP');
  if (!session.email) throw new Error('Session has no email');
  if (session.type !== 'email_register') throw new Error('Invalid session type');

  const hashed = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({
    data: {
      email: session.email,
      password: hashed,
      isActive: true, // verified via OTP
    },
  });
  // Burn the session so the same OTP can't be replayed.
  await prisma.otpSession.delete({ where: { id: sessionId } });
  return generateTokenPair(customerPayload(customer));
}

export async function phoneRegisterStep1(phone: string) {
  if (isRateLimited(`phone-register:${phone}`)) {
    throw new Error('Too many OTP requests. Please try again in a few minutes.');
  }
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) throw new Error('Phone already registered');
  const otp = generateOtp();
  const sessionId = uuidv4();
  await invalidatePriorSessions({ phone, type: 'phone_register' });
  await prisma.otpSession.create({
    data: {
      id: sessionId,
      phone,
      otp,
      type: 'phone_register',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const smsResult = await sendOtpSms(phone, otp);
  if (!smsResult.ok) {
    await prisma.otpSession.delete({ where: { id: sessionId } }).catch(() => {});
    throw new Error(`Failed to send OTP SMS: ${smsResult.errorMessage ?? 'unknown error'}`);
  }
  return { session_id: sessionId };
}

export async function phoneRegisterStep2(sessionId: string, otp: string) {
  const session = await prisma.otpSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Invalid session');
  if (new Date() > session.expiresAt) throw new Error('OTP expired');
  if (session.otp !== otp) throw new Error('Invalid OTP');
  if (!session.phone) throw new Error('Session has no phone');
  if (session.type !== 'phone_register') throw new Error('Invalid session type');

  const customer = await prisma.customer.create({
    data: { phone: session.phone, isActive: true },
  });
  await prisma.otpSession.delete({ where: { id: sessionId } });
  return generateTokenPair(customerPayload(customer));
}

export async function phoneLoginStep1(phone: string) {
  if (isRateLimited(`phone-login:${phone}`)) {
    throw new Error('Too many OTP requests. Please try again in a few minutes.');
  }
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) throw new Error('Phone not registered');
  const otp = generateOtp();
  const sessionId = uuidv4();
  await invalidatePriorSessions({ phone, type: 'phone_login' });
  await prisma.otpSession.create({
    data: {
      id: sessionId,
      phone,
      otp,
      type: 'phone_login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const smsResult = await sendOtpSms(phone, otp);
  if (!smsResult.ok) {
    await prisma.otpSession.delete({ where: { id: sessionId } }).catch(() => {});
    throw new Error(`Failed to send OTP SMS: ${smsResult.errorMessage ?? 'unknown error'}`);
  }
  return { session_id: sessionId };
}

export async function phoneLoginStep2(sessionId: string, otp: string) {
  const session = await prisma.otpSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Invalid session');
  if (new Date() > session.expiresAt) throw new Error('OTP expired');
  if (session.otp !== otp) throw new Error('Invalid OTP');
  if (!session.phone) throw new Error('Session has no phone');
  if (session.type !== 'phone_login') throw new Error('Invalid session type');

  const customer = await prisma.customer.findUnique({ where: { phone: session.phone } });
  if (!customer) throw new Error('Customer not found');
  await prisma.otpSession.delete({ where: { id: sessionId } });
  return generateTokenPair(customerPayload(customer));
}

export async function googleAuth(token: string) {
  let googleId: string;
  let email: string | null = null;
  let profileImage: string | null = null;

  const admin = await getFirebaseAdmin();
  if (admin) {
    // Cryptographically verified path
    const decoded = await admin.auth().verifyIdToken(token);
    googleId = decoded.uid;
    email = decoded.email || null;
    profileImage = decoded.picture || null;
  } else {
    // Dev fallback — unsafe, do not use in production
    if (env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin not configured. Google auth unavailable in production.');
    }
    const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    googleId = decoded.sub || decoded.googleId;
    email = decoded.email || null;
    profileImage = decoded.picture || null;
  }

  if (!googleId) throw new Error('Invalid Google token');

  let customer = await prisma.customer.findUnique({ where: { googleId } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        googleId,
        email: email || undefined,
        googleProfileImage: profileImage || undefined,
        loginMethod: 'google',
        isActive: true, // Google accounts are pre-verified
      },
    });
  }
  return generateTokenPair(customerPayload(customer));
}

// Admin login — step 1: verify password, send OTP, return session_id
export async function adminLogin(email: string, password: string) {
  if (isRateLimited(`admin-login:${email}`)) {
    throw new Error('Too many OTP requests. Please try again in a few minutes.');
  }
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !admin.password) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new Error('Invalid email or password');

  const otp = generateOtp();
  const sessionId = uuidv4();
  await invalidatePriorSessions({ email, type: 'admin_login' });
  await prisma.otpSession.create({
    data: {
      id: sessionId,
      email,
      otp,
      type: 'admin_login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const emailResult = await sendOtpEmail(email, otp);
  if (!emailResult.ok) {
    await prisma.otpSession.delete({ where: { id: sessionId } }).catch(() => {});
    throw new Error(`Failed to send OTP email: ${emailResult.errorMessage ?? 'unknown error'}`);
  }
  return { session_id: sessionId, message: 'OTP sent to your email' };
}

// Admin login — step 2: verify OTP, return JWT
export async function verifyLoginOtp(sessionId: string, otp: string) {
  const session = await prisma.otpSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Invalid session');
  if (new Date() > session.expiresAt) throw new Error('OTP expired');
  if (session.otp !== otp) throw new Error('Invalid OTP');
  if (!session.email) throw new Error('Session has no email');
  if (session.type !== 'admin_login') throw new Error('Invalid session type');

  const admin = await prisma.admin.findUnique({ where: { email: session.email } });
  if (!admin) throw new Error('Admin not found');

  await prisma.otpSession.delete({ where: { id: sessionId } });

  const adminDetails = {
    id: admin.id,
    fullName: admin.fullName,
    email: admin.email,
    isAdmin: admin.isAdmin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
  return { ...generateTokenPair(adminPayload(admin)), admin: adminDetails };
}

// Dashboard customization tool — gated by an OTP sent to a fixed owner email,
// independent of whichever admin account is currently logged in.
const DASHBOARD_TOOL_EMAIL = 'balachandar0028@gmail.com';

export async function sendDashboardToolOtp() {
  if (isRateLimited(`dashboard-tool:${DASHBOARD_TOOL_EMAIL}`)) {
    throw new Error('Too many OTP requests. Please try again in a few minutes.');
  }
  const otp = generateOtp();
  const sessionId = uuidv4();
  await invalidatePriorSessions({ email: DASHBOARD_TOOL_EMAIL, type: 'dashboard_tool' });
  await prisma.otpSession.create({
    data: {
      id: sessionId,
      email: DASHBOARD_TOOL_EMAIL,
      otp,
      type: 'dashboard_tool',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  const emailResult = await sendOtpEmail(DASHBOARD_TOOL_EMAIL, otp);
  if (!emailResult.ok) {
    await prisma.otpSession.delete({ where: { id: sessionId } }).catch(() => {});
    throw new Error(`Failed to send OTP email: ${emailResult.errorMessage ?? 'unknown error'}`);
  }
  return { session_id: sessionId, message: 'OTP sent' };
}

export async function verifyDashboardToolOtp(sessionId: string, otp: string) {
  const session = await prisma.otpSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Invalid session');
  if (new Date() > session.expiresAt) throw new Error('OTP expired');
  if (session.otp !== otp) throw new Error('Invalid OTP');
  if (session.type !== 'dashboard_tool') throw new Error('Invalid session type');

  await prisma.otpSession.delete({ where: { id: sessionId } });
  return { verified: true };
}

export async function refreshToken(refresh: string) {
  const decoded = verifyRefreshToken(refresh);
  const payload: JwtPayload = {
    id: decoded.id,
    email: decoded.email,
    isAdmin: decoded.isAdmin,
    type: decoded.type,
  };
  return generateTokenPair(payload);
}

export async function setPassword(token: string, password: string) {
  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset) throw new Error('Invalid or expired token');
  if (reset.isUsed) throw new Error('Token already used');
  if (new Date() > reset.expiresAt) throw new Error('Token expired');

  const hashed = await bcrypt.hash(password, 10);
  if (reset.isAdmin) {
    await prisma.admin.update({ where: { email: reset.email }, data: { password: hashed } });
  } else {
    await prisma.customer.update({ where: { email: reset.email }, data: { password: hashed } });
  }
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { isUsed: true } });
}
