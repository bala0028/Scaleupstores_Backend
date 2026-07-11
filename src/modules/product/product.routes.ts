import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as productController from './product.controller';
import { productSchemas } from './product.schema';

const { body: _cpBody, ...createProductSchema } = productSchemas.createProduct;
const { body: _upBody, ...updateProductSchema } = productSchemas.updateProduct;
const { body: _uvBody, ...updateVariantSchema } = productSchemas.updateVariant;

export default async function productRoutes(app: FastifyInstance) {
  // Admin Product CRUD
  app.post('/product/', { schema: createProductSchema, preHandler: [authenticate, requireAdmin] }, productController.createProduct);
  app.get('/product/', {  preHandler: [authenticate, requireAdmin] }, productController.listProductsAdmin);
  app.get('/product/:id/', { schema: productSchemas.getProductById, preHandler: [authenticate, requireAdmin] }, productController.getProductByIdAdmin);
  app.put('/product/:id/', { schema: updateProductSchema, preHandler: [authenticate, requireAdmin] }, productController.updateProduct);
  app.delete('/product/:id/', { schema: productSchemas.deleteProduct, preHandler: [authenticate, requireAdmin] }, productController.deleteProduct);

  // Public Products
  app.get('/productlist/', { schema: productSchemas.listProductsPublic }, productController.listProductsPublic);
  app.get('/productlist/:id/', { schema: productSchemas.getProductDetailsPublic }, productController.getProductDetailsPublic);
  app.get('/stock/', { schema: productSchemas.checkStock }, productController.checkStock);
  app.get('/productfilter/:catId/', { schema: productSchemas.filterByCategory }, productController.filterByCategory);

  // Variants
  app.post('/productvariant/', { preHandler: [authenticate, requireAdmin] }, productController.createVariant);
  app.get('/productvariant/', { preHandler: [authenticate, requireAdmin] }, productController.listVariantsAdmin);
  app.put('/productvariant/:id/', { schema: updateVariantSchema, preHandler: [authenticate, requireAdmin] }, productController.updateVariant);
  app.delete('/productvariant/:id/', { schema: productSchemas.deleteVariant, preHandler: [authenticate, requireAdmin] }, productController.deleteVariant);
  app.get('/productvariant/:id/', { schema: productSchemas.getVariantById }, productController.getVariantById);
  app.get('/productvariantfilter/', { schema: productSchemas.filterVariants }, productController.filterVariants);
  app.get('/mainproductlist/', { preHandler: [authenticate, requireAdmin] }, productController.mainProductList);

  // Feedback
  app.post('/feedback/:productId/', { schema: productSchemas.addOrUpdateFeedback, preHandler: [authenticate] }, productController.addOrUpdateFeedback);
  app.get('/product-feedback-list/:productId/', { schema: productSchemas.getApprovedFeedbackList, preHandler: [authenticate] }, productController.getApprovedFeedbackList);
  app.get('/product-rating-summary/:productId/', { schema: productSchemas.getRatingSummary }, productController.getRatingSummary);
  app.get('/product-feedback-filter/:productId/', { schema: productSchemas.filterFeedbackByRating }, productController.filterFeedbackByRating);
  app.get('/admin-feedback-list/', { schema: productSchemas.adminFeedbackList, preHandler: [authenticate, requireAdmin] }, productController.adminFeedbackList);
  app.post('/admin-approval/:reviewId/', { schema: productSchemas.adminApproval, preHandler: [authenticate, requireAdmin] }, productController.adminApproval);
  app.get('/admin-feedback/:reviewId/', { schema: productSchemas.getAdminFeedbackDetail, preHandler: [authenticate, requireAdmin] }, productController.getAdminFeedbackDetail);
  app.delete('/admin-feedback-delete/:reviewId/', { schema: productSchemas.deleteAdminFeedback, preHandler: [authenticate, requireAdmin] }, productController.deleteAdminFeedback);

  // Favorites
  app.post('/favorites/toggle/', { schema: productSchemas.toggleFavorite, preHandler: [authenticate] }, productController.toggleFavorite);
  app.get('/favorites/', { schema: productSchemas.getFavorites, preHandler: [authenticate] }, productController.getFavorites);
  app.get('/favorites/ids/', { schema: productSchemas.getFavoriteIds, preHandler: [authenticate] }, productController.getFavoriteIds);

  // Search
  app.get('/products/search/', { schema: productSchemas.globalProductSearch }, productController.globalProductSearch);
  app.get('/orders/search/', { schema: productSchemas.globalOrderSearch, preHandler: [authenticate, requireAdmin] }, productController.globalOrderSearch);
  app.post('/bulk-price-update/', { preHandler: [authenticate, requireAdmin] }, productController.bulkPriceUpdate);
}
