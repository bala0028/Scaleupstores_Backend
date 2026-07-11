import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as categoryController from './category.controller';
import { categorySchemas } from './category.schema';

const { body: _uc, ...updateCategorySchema } = categorySchemas.updateCategory;

export default async function categoryRoutes(app: FastifyInstance) {
  app.post('/categories/', { preHandler: [authenticate, requireAdmin] }, categoryController.createCategory);
  app.get('/categories/', { preHandler: [authenticate, requireAdmin] }, categoryController.listCategoriesAdmin);
  app.get('/categories/:id', { schema: categorySchemas.getCategoryById, preHandler: [authenticate, requireAdmin] }, categoryController.getCategoryByIdAdmin);
  app.put('/categories/:id', { schema: updateCategorySchema, preHandler: [authenticate, requireAdmin] }, categoryController.updateCategory);
  app.delete('/categories/:id', { schema: categorySchemas.deleteCategory, preHandler: [authenticate, requireAdmin] }, categoryController.deleteCategory);
  app.get('/categorylist/', categoryController.listCategoriesPublic);
  app.get('/categorylist/:id', { schema: categorySchemas.getCategoryById }, categoryController.getCategoryByIdPublic);
}
