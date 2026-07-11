import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../config/env';

export async function registerAuthPlugin(app: FastifyInstance) {
  const origins = env.CORS_ORIGIN.split(',').map(o => o.trim());
  await app.register(fastifyCors, {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}
