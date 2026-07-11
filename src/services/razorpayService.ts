import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { env } from '../config/env';

let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return razorpayInstance;
}

export async function createRazorpayOrder(amount: number, currency: string = 'INR', receipt?: string) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return { id: `mock_order_${Date.now()}`, amount: amount * 100, currency, receipt, status: 'created' };
  }
  return await getRazorpay().orders.create({ amount: amount * 100, currency, receipt, payment_capture: true });
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  return expected === signature;
}

export async function getPaymentById(paymentId: string) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return { id: paymentId, status: 'mock', method: 'mock', amount: 0, currency: 'INR' };
  }
  return getRazorpay().payments.fetch(paymentId);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  return expected === signature;
}
