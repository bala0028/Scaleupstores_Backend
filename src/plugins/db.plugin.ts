import { FastifyInstance } from 'fastify';
import prisma from '../config/db';

export async function registerDbPlugin(app: FastifyInstance) {
  await prisma.$connect();
  app.log.info('Database connected');

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    app.log.info('Database disconnected');
  });
}

export { prisma };
