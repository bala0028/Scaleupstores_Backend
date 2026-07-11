import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as adminController from './admin.controller';

export default async function adminRoutes(app: FastifyInstance) {
  app.get('/Dashboard/', { preHandler: [authenticate, requireAdmin] }, adminController.getDashboard);
}
