import dotenv from 'dotenv';
import path from 'path';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

const readEnv = (key: string, fallback = ''): string => {
  const value = process.env[key];
  return value ? value.trim() : fallback;
};

export const env = {
  PORT: parseInt(readEnv('PORT', '8000'), 10),
  HOST: readEnv('HOST', '0.0.0.0'),
  NODE_ENV: readEnv('NODE_ENV', 'development'),

  DATABASE_URL: readEnv('DATABASE_URL'),

  JWT_SECRET: readEnv('JWT_SECRET', 'fallback-jwt-secret'),
  JWT_REFRESH_SECRET: readEnv('JWT_REFRESH_SECRET', 'fallback-refresh-secret'),
  JWT_EXPIRES_IN: readEnv('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: readEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  AWS_ACCESS_KEY_ID: readEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: readEnv('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: readEnv('AWS_REGION', 'us-east-1'),
  AWS_S3_BUCKET: readEnv('AWS_S3_BUCKET', 'scaleupstores-uploads'),

  RAZORPAY_KEY_ID: readEnv('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: readEnv('RAZORPAY_KEY_SECRET'),
  RAZORPAY_WEBHOOK_SECRET: readEnv('RAZORPAY_WEBHOOK_SECRET'),

  SMTP_HOST: readEnv('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: parseInt(readEnv('SMTP_PORT', '587'), 10),
  SMTP_USER: readEnv('SMTP_USER'),
  SMTP_PASS: readEnv('SMTP_PASS'),
  EMAIL_FROM: readEnv('EMAIL_FROM', 'noreply@scaleupstores.com'),

  TWILIO_ACCOUNT_SID: readEnv('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: readEnv('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: readEnv('TWILIO_PHONE_NUMBER'),

  CORS_ORIGIN: readEnv('CORS_ORIGIN', 'http://localhost:3000'),
  FRONTEND_URL: readEnv('FRONTEND_URL', 'http://localhost:3000'),
};
