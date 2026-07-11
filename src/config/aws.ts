import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export async function uploadFile(buffer: Buffer, mimeType: string, folder: string = 'uploads'): Promise<string> {
  const ext = mimeType.split('/')[1] || 'bin';
  const filename = `${uuidv4()}-${Date.now()}.${ext}`;

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
  }

  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const key = `${folder}/${filename}`;
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });
  await getS3Client().send(command);
  const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  console.log('[S3] File uploaded:', url);
  return url;
}

export async function deleteFile(url: string): Promise<boolean> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) return true;
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const key = url.split('.amazonaws.com/')[1];
    if (!key) return false;
    const command = new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key });
    await getS3Client().send(command);
    return true;
  } catch (error) {
    console.error('S3 delete failed:', error);
    return false;
  }
}
