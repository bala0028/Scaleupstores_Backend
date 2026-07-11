import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import * as offerController from './offer.controller';
import { offerSchemas } from './offer.schema';

export default async function offerRoutes(app: FastifyInstance) {
  app.post('/offers/', { preHandler: [authenticate, requireAdmin] }, offerController.createOffer);
  app.get('/offers/', { preHandler: [authenticate, requireAdmin] }, offerController.listOffersAdmin);
  app.get('/offers/:id/', { schema: offerSchemas.getOfferById, preHandler: [authenticate, requireAdmin] }, offerController.getOfferByIdAdmin);
  app.put('/offers/:id/', { schema: offerSchemas.updateOffer, preHandler: [authenticate, requireAdmin] }, offerController.updateOffer);
  app.delete('/offers/:id/', { schema: offerSchemas.deleteOffer, preHandler: [authenticate, requireAdmin] }, offerController.deleteOffer);
  app.get('/offers/category/:id/', { schema: offerSchemas.getProductsByCategory, preHandler: [authenticate] }, offerController.getProductsByCategoryViaOffer);
  app.get('/offers/products/all', { preHandler: [authenticate] }, offerController.getAllProductsViaOffer);

  // Public endpoint for customer-facing offers
  app.get('/offers/public', offerController.listOffersPublic);
}
