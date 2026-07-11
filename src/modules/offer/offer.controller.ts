import { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import * as offerService from './offer.service';

export async function createOffer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as Record<string, any> | Record<string, any>[];
    
    // Handle both single offer and array of offers
    const offers = Array.isArray(body) ? body : [body];
    
    if (offers.length === 0) return sendError(reply, 'Offer data is required', 400);
    
    const createdOffers = [];
    for (const offerData of offers) {
      if (!offerData.offerName) return sendError(reply, 'Offer name is required', 400);

      const categoryId = offerData.category_id ? parseInt(offerData.category_id) : offerData.categoryId ? parseInt(offerData.categoryId) : null;
      const productId = offerData.product_id ? parseInt(offerData.product_id) : offerData.productId ? parseInt(offerData.productId) : null;

      // If categoryId is explicitly null (meaning "all categories"), don't require productId
      if (categoryId === null && productId === null) {
        return sendError(reply, 'Product is required when category is not "all"', 400);
      }

      const offer = await offerService.createOffer({
        categoryId,
        productId,
        offerName: offerData.offerName,
        offerPercentage: offerData.offer_percentage ? parseFloat(offerData.offer_percentage) : offerData.offerPercentage ? parseFloat(offerData.offerPercentage) : null,
        startDate: offerData.start_date || offerData.startDate,
        endDate: offerData.end_date || offerData.endDate,
        isActive: offerData.is_active !== undefined ? offerData.is_active === 'true' || offerData.is_active === true : offerData.isActive,
      });
      createdOffers.push(offer);
    }
    
    return sendSuccess(reply, createdOffers, 'Offer(s) created', 201);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listOffersAdmin(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const offers = await offerService.getAllOffers();
    return sendSuccess(reply, offers);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getOfferByIdAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const offer = await offerService.getOfferById(parseInt(id));
    if (!offer) return sendNotFound(reply, 'Offer not found');
    return sendSuccess(reply, offer);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateOffer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await offerService.getOfferById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Offer not found');

    const body = request.body as Record<string, any>;
    const data: Record<string, any> = {};

    if (body.category_id !== undefined) data.categoryId = body.category_id ? parseInt(body.category_id) : null;
    if (body.product_id !== undefined) data.productId = body.product_id ? parseInt(body.product_id) : null;
    if (body.offer_name !== undefined) data.offerName = body.offer_name;
    if (body.offer_percentage !== undefined) data.offerPercentage = body.offer_percentage ? parseFloat(body.offer_percentage) : null;
    if (body.start_date !== undefined) data.startDate = body.start_date;
    if (body.end_date !== undefined) data.endDate = body.end_date;
    if (body.is_active !== undefined) data.isActive = body.is_active === 'true' || body.is_active === true;

    if (body.offerName !== undefined) data.offerName = body.offerName;
    if (body.offerPercentage !== undefined) data.offerPercentage = body.offerPercentage;
    if (body.startDate !== undefined) data.startDate = body.startDate;
    if (body.endDate !== undefined) data.endDate = body.endDate;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.productId !== undefined) data.productId = body.productId;

    const offer = await offerService.updateOffer(parseInt(id), data);
    return sendSuccess(reply, offer, 'Offer updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteOffer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await offerService.getOfferById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Offer not found');
    await offerService.deleteOffer(parseInt(id));
    return sendSuccess(reply, null, 'Offer deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getProductsByCategoryViaOffer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const products = await offerService.getProductsByCategory(parseInt(id));
    return sendSuccess(reply, products);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getAllProductsViaOffer(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const products = await offerService.getAllProducts();
    return sendSuccess(reply, products);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listOffersPublic(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const offers = await offerService.getActiveOffers();
    return sendSuccess(reply, offers);
  } catch (error) {
    return sendServerError(reply, error);
  }
}
