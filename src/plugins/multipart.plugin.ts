import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';

export async function registerMultipartPlugin(app: FastifyInstance) {
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });
}
