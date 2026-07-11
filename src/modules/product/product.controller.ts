import { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import * as productService from './product.service';

export async function createProduct(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { fields: body, imageUrl } = await productService.parseBodyAndFile(request);
    const productName = body.product_name;
    if (!productName) return sendError(reply, 'Product Name is required', 400);

    const product = await productService.createProduct({
      productName: body.product_name || body.productName,
      productDescription: body.product_description || body.productDescription || null,
      price: parseFloat(body.price),
      quantity: body.quantity ? parseFloat(body.quantity) : null,
      quantityUnit: body.quantity_unit || body.quantityUnit || null,
      weight: body.weight || null,
      categoryId: (body.category_id || body.categoryId || body.category) ? parseInt(body.category_id || body.categoryId || body.category) : null,
      stockQuantity: (body.stock_quantity || body.stockQuantity) ? parseInt(body.stock_quantity || body.stockQuantity) : 0,
      image: imageUrl || body.image || null,
    });
    return sendSuccess(reply, product, 'Product created', 201);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listProductsAdmin(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const products = await productService.getAllAdmin();
    return sendSuccess(reply, products, 'Products retrieved', 200);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getProductByIdAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const product = await productService.getByIdAdmin(parseInt(id));
    if (!product) return sendNotFound(reply, 'Product not found');
    return sendSuccess(reply, product);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateProduct(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await productService.getByIdAdmin(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Product not found');

    const { fields: body, imageUrl } = await productService.parseBodyAndFile(request);
    const data: Record<string, any> = {};

    const name = body.product_name !== undefined ? body.product_name : body.productName;
    if (name !== undefined) data.productName = name;

    const desc = body.product_description !== undefined ? body.product_description : body.productDescription;
    if (desc !== undefined) data.productDescription = desc;

    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.quantity !== undefined) data.quantity = parseFloat(body.quantity);

    const unit = body.quantity_unit !== undefined ? body.quantity_unit : body.quantityUnit;
    if (unit !== undefined) data.quantityUnit = unit;

    if (body.weight !== undefined) data.weight = body.weight || null;

    const catId = body.category_id !== undefined ? body.category_id : body.categoryId !== undefined ? body.categoryId : body.category;
    if (catId !== undefined) data.categoryId = catId ? parseInt(catId) : null;

    const stock = body.stock_quantity !== undefined ? body.stock_quantity : body.stockQuantity;
    if (stock !== undefined) data.stockQuantity = parseInt(stock);

    const active = body.is_active !== undefined ? body.is_active : body.isActive;
    if (active !== undefined) data.isActive = active === 'true' || active === true;

    if (imageUrl) {
      data.image = imageUrl;
    } else if (body.image !== undefined) {
      data.image = body.image || null;
    }

    const product = await productService.updateProduct(parseInt(id), data);
    return sendSuccess(reply, product, 'Product updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteProduct(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await productService.getByIdAdmin(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Product not found');
    await productService.removeProduct(parseInt(id));
    return sendSuccess(reply, null, 'Product deleted');
  } catch (error: any) {
    if (error.code === 'P2003') {
      return sendError(reply, 'Cannot delete product because it is referenced by other records (e.g., orders). Please deactivate it instead.', 400);
    }
    return sendServerError(reply, error);
  }
}

export async function listProductsPublic(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { offer_only } = request.query as any;
    const products = await productService.listPublic(offer_only === 'true');
    return sendSuccess(reply, products);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getProductDetailsPublic(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const product = await productService.getDetails(parseInt(id));
    if (!product) return sendNotFound(reply, 'Product not found');
    return sendSuccess(reply, product);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function checkStock(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { product_id } = request.query as any;
    if (!product_id) return sendError(reply, 'product_id is required');

    const result = await productService.checkStock(parseInt(product_id));
    if (!result) return sendNotFound(reply, 'Product not found');
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function filterByCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { catId } = request.params as any;
    const { page = '1', page_size = '24' } = request.query as any;
    const result = await productService.filterByCategory(parseInt(catId), parseInt(page), parseInt(page_size));
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function createVariant(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { fields: body, imageUrl } = await productService.parseBodyAndFile(request);
    const variant = await productService.createVariant({
      parentId: parseInt(body.parent || body.parentId),
      productName: body.product_name || body.productName,
      productDescription: body.product_description || body.productDescription || null,
      price: parseFloat(body.price),
      quantity: body.quantity ? parseFloat(body.quantity) : null,
      quantityUnit: body.quantity_unit || body.quantityUnit || null,
      weight: body.weight || null,
      stockQuantity: (body.stock_quantity || body.stockQuantity) ? parseInt(body.stock_quantity || body.stockQuantity) : 0,
      image: imageUrl || body.image || null,
    });
    return sendSuccess(reply, variant, 'Variant created', 201);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listVariantsAdmin(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const variants = await productService.getAllVariants();
    return sendSuccess(reply, variants);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getVariantById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const variant = await productService.getVariantById(parseInt(id));
    if (!variant) return sendNotFound(reply, 'Variant not found');
    return sendSuccess(reply, variant);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateVariant(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await productService.getVariantById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Variant not found');

    const { fields: body, imageUrl } = await productService.parseBodyAndFile(request);
    const data: Record<string, any> = {};

    const parent = body.parent !== undefined ? body.parent : body.parentId;
    if (parent !== undefined) data.parentId = parseInt(parent);

    const name = body.product_name !== undefined ? body.product_name : body.productName;
    if (name !== undefined) data.productName = name;

    const desc = body.product_description !== undefined ? body.product_description : body.productDescription;
    if (desc !== undefined) data.productDescription = desc;

    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.quantity !== undefined) data.quantity = parseFloat(body.quantity);

    const unit = body.quantity_unit !== undefined ? body.quantity_unit : body.quantityUnit;
    if (unit !== undefined) data.quantityUnit = unit;

    if (body.weight !== undefined) data.weight = body.weight || null;

    const stock = body.stock_quantity !== undefined ? body.stock_quantity : body.stockQuantity;
    if (stock !== undefined) data.stockQuantity = parseInt(stock);

    const active = body.is_active !== undefined ? body.is_active : body.isActive;
    if (active !== undefined) data.isActive = active === 'true' || active === true;

    if (imageUrl) {
      data.image = imageUrl;
    } else if (body.image !== undefined) {
      data.image = body.image || null;
    }

    const variant = await productService.updateVariant(parseInt(id), data);
    return sendSuccess(reply, variant, 'Variant updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteVariant(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await productService.getVariantById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Variant not found');
    await productService.deleteVariant(parseInt(id));
    return sendSuccess(reply, null, 'Variant deleted');
  } catch (error: any) {
    if (error.code === 'P2003') {
      return sendError(reply, 'Cannot delete variant because it is referenced by other records. Please deactivate it instead.', 400);
    }
    return sendServerError(reply, error);
  }
}

export async function filterVariants(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { parent_id } = request.query as any;
    if (!parent_id) return sendError(reply, 'parent_id is required');

    const variants = await productService.filterVariants(parseInt(parent_id));
    return sendSuccess(reply, variants);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function mainProductList(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const products = await productService.mainProductList();
    return sendSuccess(reply, products);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function addOrUpdateFeedback(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const { productId } = request.params as any;
    const user = request.user;
    if (!user) return sendError(reply, 'Authentication required', 401);
    if (user.type !== 'customer') return sendError(reply, 'Only customers can submit feedback', 403);

    const { rating, comment } = request.body as any;
    if (!rating || rating < 1 || rating > 5) return sendError(reply, 'Rating must be between 1 and 5');

    const product = await productService.getByIdAdmin(parseInt(productId));
    if (!product) return sendNotFound(reply, 'Product not found');

    const feedback = await productService.addOrUpdateFeedback(parseInt(productId), user.id, parseInt(rating), comment);
    return sendSuccess(reply, feedback, 'Feedback submitted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getApprovedFeedbackList(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { productId } = request.params as any;
    const feedbacks = await productService.getApprovedList(parseInt(productId));
    return sendSuccess(reply, feedbacks);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getRatingSummary(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { productId } = request.params as any;
    const summary = await productService.getRatingSummary(parseInt(productId));
    return sendSuccess(reply, summary);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function filterFeedbackByRating(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { productId } = request.params as any;
    const { rating, page = '1', page_size = '10' } = request.query as any;
    const result = await productService.filterByRating(
      parseInt(productId),
      rating ? parseInt(rating) : undefined,
      parseInt(page),
      parseInt(page_size),
    );
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function adminFeedbackList(request: FastifyRequest, reply: FastifyReply) {
  try {
    const {
      product_id,
      category_id,
      rating,
      ordering = '-created_at',
      page = '1',
      page_size = '10',
    } = request.query as any;

    const result = await productService.adminFeedbackList({
      productId: product_id ? parseInt(product_id) : undefined,
      categoryId: category_id ? parseInt(category_id) : undefined,
      rating: rating ? parseInt(rating) : undefined,
      ordering,
      page: parseInt(page),
      pageSize: parseInt(page_size),
    });
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function adminApproval(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { reviewId } = request.params as any;
    const { action } = request.body as any;

    if (!action || !['approve', 'reject'].includes(action)) {
      return sendError(reply, "Action must be 'approve' or 'reject'");
    }

    const existing = await productService.getAdminDetail(parseInt(reviewId));
    if (!existing) return sendNotFound(reply, 'Feedback not found');

    const feedback = await productService.adminApprove(parseInt(reviewId), action);
    return sendSuccess(reply, feedback, `Feedback ${action === 'approve' ? 'approved' : 'rejected'}`);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getAdminFeedbackDetail(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { reviewId } = request.params as any;
    const feedback = await productService.getAdminDetail(parseInt(reviewId));
    if (!feedback) return sendNotFound(reply, 'Feedback not found');
    return sendSuccess(reply, feedback);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteAdminFeedback(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { reviewId } = request.params as any;
    const existing = await productService.getAdminDetail(parseInt(reviewId));
    if (!existing) return sendNotFound(reply, 'Feedback not found');
    await productService.deleteFeedback(parseInt(reviewId));
    return sendSuccess(reply, null, 'Feedback deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function toggleFavorite(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const user = request.user;
    if (!user) return sendError(reply, 'Authentication required', 401);

    const { product_id } = request.body as any;
    if (!product_id) return sendError(reply, 'product_id is required');

    const productId = parseInt(product_id);
    const product = await productService.getByIdAdmin(productId);
    if (!product) return sendNotFound(reply, 'Product not found');

    const result = await productService.toggleFavorite(user.id, productId);
    const message = result.is_favorited ? 'Added to favorites' : 'Removed from favorites';
    return sendSuccess(reply, result, message);
  } catch (error: any) {
    if (error.code === 'P2003') return sendError(reply, 'Product does not exist', 400);
    return sendServerError(reply, error);
  }
}

export async function getFavorites(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const user = request.user;
    if (!user) return sendError(reply, 'Authentication required', 401);

    const favorites = await productService.getFavoritesList(user.id);
    return sendSuccess(reply, favorites);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getFavoriteIds(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const user = request.user;
    if (!user) return sendError(reply, 'Authentication required', 401);

    const { product_id } = request.query as any;
    const result = await productService.getFavoriteIds(user.id, product_id ? parseInt(product_id) : undefined);
    return sendSuccess(reply, result);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function globalProductSearch(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { search } = request.query as any;
    if (!search) return sendError(reply, 'Search query parameter is required');

    const products = await productService.searchProducts(search);
    return sendSuccess(reply, products);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function globalOrderSearch(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { order_id } = request.query as any;
    if (!order_id) return sendError(reply, 'order_id query parameter is required');

    const orders = await productService.searchOrders(order_id);
    return sendSuccess(reply, orders);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function bulkPriceUpdate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { category_id, price_adjustment, adjustment_type } = request.body as any;
    if (!category_id || price_adjustment === undefined) {
      return sendError(reply, 'category_id and price_adjustment are required');
    }
    const result = await productService.bulkPriceUpdate(
      Number(category_id),
      Number(price_adjustment),
      adjustment_type || 'fixed',
    );
    return sendSuccess(reply, result, 'Prices updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getProductsByCategoryWithOffers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const products = await productService.getProductsByCategory(Number(id));
    return sendSuccess(reply, products);
  } catch (error) {
    return sendServerError(reply, error);
  }
}
