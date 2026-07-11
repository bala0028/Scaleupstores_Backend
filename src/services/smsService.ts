import { env } from '../config/env';

export interface SmsResult {
  ok: boolean;
  errorMessage?: string;
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    console.log(`[SMS Mock] To: ${phone}, Message: ${message}`);
    return { ok: true };
  }

  if (!accountSid.startsWith('AC')) {
    console.error(`[SMS] Invalid Twilio SID configured: ${accountSid}`);
    return { ok: false, errorMessage: 'Invalid Twilio account SID configured' };
  }

  try {
    const client = require('twilio')(accountSid, authToken);
    await client.messages.create({ body: message, from: env.TWILIO_PHONE_NUMBER, to: phone });
    return { ok: true };
  } catch (error: any) {
    const message = error?.message || 'unknown error';
    console.error(`[SMS] send failed to=${phone} message=${message}`);
    return { ok: false, errorMessage: message };
  }
}

export async function sendOtpSms(phone: string, otp: string): Promise<SmsResult> {
  return sendSms(phone, `Your ScaleUpStores verification OTP is: ${otp}. Valid for 10 minutes.`);
}