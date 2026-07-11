import { randomInt } from 'crypto';

export function generateOtp(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return randomInt(min, max + 1).toString();
}

export function isOtpValid(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
