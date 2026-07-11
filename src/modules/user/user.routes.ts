import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as userController from './user.controller';
import { userSchemas } from './user.schema';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/customerdetails/', { preHandler: [authenticate] }, userController.updateCustomerDetails);
  app.put('/customerdetails/:id/', { schema: userSchemas.updateCustomerDetailsById, preHandler: [authenticate] }, userController.updateCustomerDetails);
  app.get('/customerslist/', { preHandler: [authenticate, requireAdmin] }, userController.listCustomers);
  app.get('/customerslist/:id/', { schema: userSchemas.getCustomerById, preHandler: [authenticate, requireAdmin] }, userController.getCustomerById);
  app.get('/adminsdetails/', { preHandler: [authenticate, requireAdmin] }, userController.listAdmins);
  app.post('/adminsdetails/', { schema: userSchemas.createAdmin, preHandler: [authenticate, requireAdmin] }, userController.createAdmin);
  app.get('/adminsdetails/:id/', { schema: userSchemas.getAdminById, preHandler: [authenticate, requireAdmin] }, userController.getAdminById);
  app.put('/adminsdetails/:id/', { schema: userSchemas.updateAdmin, preHandler: [authenticate, requireAdmin] }, userController.updateAdmin);
  app.delete('/adminsdetails/:id/', { schema: userSchemas.deleteAdmin, preHandler: [authenticate, requireAdmin] }, userController.deleteAdmin);
}
