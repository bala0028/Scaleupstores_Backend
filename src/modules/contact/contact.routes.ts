import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as contactController from './contact.controller';
import { contactSchemas } from './contact.schema';

export default async function contactRoutes(app: FastifyInstance) {
  app.post('/contactus/', { schema: contactSchemas.createContactMessage }, contactController.createContactMessage);
  app.get('/contactus/', { preHandler: [authenticate, requireAdmin] }, contactController.listContactMessages);
  app.get('/contactus/:id/', { schema: contactSchemas.getContactMessageById, preHandler: [authenticate, requireAdmin] }, contactController.getContactMessageById);
  app.delete('/contactus/:id/', { schema: contactSchemas.deleteContactMessage, preHandler: [authenticate, requireAdmin] }, contactController.deleteContactMessage);
}
