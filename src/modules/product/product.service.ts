import { FastifyRequest } from 'fastify';
import prisma from '../../config/db';
import { uploadFile } from '../../config/aws';

export async function parseBodyAndFile(request: FastifyRequest): Promise<{ fields: Record<string, any>; imageUrl?: string | null }> {
  const isMultipart = (request as any).isMultipart();
  if (!isMultipart) return { fields: request.body as Record<string, any> };

  const parts = (request as any).parts();
  let imageBuffer: Buffer | null = null;
  let imageMimeType: string | null = null;
  const fields: Record<string, any> = {};

  for await (const part of parts) {
    if (part.type === 'file') {
      imageBuffer = await part.toBuffer();
      imageMimeType = part.mimetype;
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  let imageUrl: string | null | undefined;
  if (imageBuffer && imageMimeType) {
    imageUrl = await uploadFile(imageBuffer, imageMimeType, 'products');
  }
  return { fields, imageUrl };
}

export async function createProduct(data: {
  productName: string;
  productDescription?: string | null;
  price: number;
  quantity?: number | null;
  quantityUnit?: string | null;
  weight?: string | null;
  categoryId?: number | null;
  stockQuantity?: number;
  image?: string | null;
}) {
  return prisma.product.create({
    data: {
      productName: data.productName,
      productDescription: data.productDescription ?? null,
      price: data.price,
      quantity: data.quantity != null ? String(data.quantity) : null,
      quantityUnit: data.quantityUnit != null ? String(data.quantityUnit) : null,
      weight: data.weight ?? null,
      categoryId: data.categoryId ?? null,
      stockQuantity: data.stockQuantity ?? 0,
      image: data.image ?? null,
    }
  });
}

export async function getAllAdmin() {
  return prisma.product.findMany({
    include: { category: true, offers: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getByIdAdmin(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, offers: true, variants: true },
  });
}

export async function updateProduct(id: number, data: Record<string, any>) {
  const before = await prisma.product.findUnique({ where: { id }, select: { stockQuantity: true } });

  const updated = await prisma.product.update({
    where: { id },
    data,
    include: { category: true, offers: true },
  });

  // Back-in-stock trigger: was 0, now > 0 → notify subscribers
  if (before && before.stockQuantity === 0 && updated.stockQuantity > 0) {
    const subs = await prisma.stockNotification.findMany({
      where: { productId: id, isNotified: false },
      include: { customer: { select: { email: true } } },
    });

    if (subs.length > 0) {
      const { sendBackInStockEmail } = await import('../../services/emailService');
      for (const sub of subs) {
        const email = sub.email || sub.customer?.email;
        if (email) {
          await sendBackInStockEmail(email, updated.productName, id).catch(() => {});
        }
        await prisma.stockNotification.update({ where: { id: sub.id }, data: { isNotified: true } });
      }
    }
  }

  return updated;
}

export async function removeProduct(id: number) {
  await prisma.favorite.deleteMany({ where: { productId: id } });
  await prisma.feedback.deleteMany({ where: { productId: id } });
  await prisma.offer.deleteMany({ where: { productId: id } });
  await prisma.stockNotification.deleteMany({ where: { productId: id } });
  await prisma.orderItem.deleteMany({ where: { productId: id } });
  
  return prisma.product.delete({ where: { id } });
}

export async function listPublic(offerOnly?: boolean) {
  const now = new Date();
  const where: any = { isActive: true };
  if (offerOnly) {
    where.offers = {
      some: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    };
  }
  return prisma.product.findMany({
    where,
    include: {
      category: true,
      offers: {
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDetails(id: number) {
  const now = new Date();
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      offers: {
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      },
    },
  });
  if (!product) return null;

  const feedbackAgg = await prisma.feedback.aggregate({
    where: { productId: id, isApproved: true },
    _avg: { rating: true },
    _count: { id: true },
  });

  return {
    ...product,
    average_rating: feedbackAgg._avg.rating ? Math.round(feedbackAgg._avg.rating * 10) / 10 : 0,
    feedback_count: feedbackAgg._count.id,
  };
}

export async function checkStock(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true },
  });
  if (!product) return null;
  return {
    in_stock: product.stockQuantity > 0,
    stock_quantity: product.stockQuantity,
  };
}

export async function filterByCategory(catId: number, page: number, pageSize: number) {
  const where = { categoryId: catId, isActive: true };
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, offers: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total, page, page_size: pageSize };
}

export async function createVariant(data: {
  parentId: number;
  productName: string;
  productDescription?: string | null;
  price: number;
  quantity?: number | null;
  quantityUnit?: string | null;
  weight?: string | null;
  stockQuantity?: number;
  image?: string | null;
}) {
  return prisma.productVariant.create({
    data: {
      parentId: data.parentId,
      productName: data.productName,
      productDescription: data.productDescription ?? null,
      price: data.price,
      quantity: data.quantity != null ? String(data.quantity) : null,
      quantityUnit: data.quantityUnit != null ? String(data.quantityUnit) : null,
      weight: data.weight ?? null,
      stockQuantity: data.stockQuantity ?? 0,
      image: data.image ?? null,
    }
  });
}

export async function getAllVariants() {
  return prisma.productVariant.findMany({
    include: { parent: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getVariantById(id: number) {
  return prisma.productVariant.findUnique({
    where: { id },
    include: { parent: true },
  });
}

export async function updateVariant(id: number, data: Record<string, any>) {
  return prisma.productVariant.update({
    where: { id },
    data,
    include: { parent: true },
  });
}

export async function deleteVariant(id: number) {
  return prisma.productVariant.delete({ where: { id } });
}

export async function filterVariants(parentId: number) {
  return prisma.productVariant.findMany({
    where: { parentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function mainProductList() {
  return prisma.product.findMany({
    where: { variants: { some: {} } },
    include: { variants: true },
    orderBy: { productName: 'asc' },
  });
}

export async function addOrUpdateFeedback(productId: number, customerId: number, rating: number, comment?: string | null) {
  return prisma.feedback.upsert({
    where: { customerId_productId: { productId, customerId } },
    update: { rating, comment: comment ?? null },
    create: { productId, customerId, rating, comment: comment ?? null },
    include: { product: true, customer: true },
  });
}

export async function getApprovedList(productId: number) {
  return prisma.feedback.findMany({
    where: { productId, isApproved: true },
    include: { customer: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRatingSummary(productId: number) {
  const feedbacks = await prisma.feedback.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });

  const totalCount = feedbacks.length;
  const averageRating = totalCount > 0
    ? Math.round((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount) * 10) / 10
    : 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of feedbacks) {
    distribution[f.rating] = (distribution[f.rating] || 0) + 1;
  }

  return { average_rating: averageRating, total_count: totalCount, distribution };
}

export async function filterByRating(productId: number, rating?: number, page: number = 1, pageSize: number = 10) {
  const where: any = { productId, isApproved: true };
  if (rating) where.rating = rating;

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { customer: { select: { id: true, fullName: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.feedback.count({ where }),
  ]);
  return { feedbacks, total, page, page_size: pageSize };
}

export async function adminFeedbackList(params: {
  productId?: number;
  categoryId?: number;
  rating?: number;
  ordering?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: any = {};
  if (params.productId) where.productId = params.productId;
  if (params.rating) where.rating = params.rating;
  if (params.categoryId) {
    where.product = { categoryId: params.categoryId };
  }

  const ordering = params.ordering || '-created_at';
  const orderField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
  const orderDir = ordering.startsWith('-') ? 'desc' : 'asc';
  const prismaField = orderField === 'created_at' ? 'createdAt' : orderField;

  const pageNum = params.page || 1;
  const pageSize = params.pageSize || 10;

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { product: true, customer: true },
      orderBy: { [prismaField]: orderDir },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.feedback.count({ where }),
  ]);
  return { feedbacks, total, page: pageNum, page_size: pageSize };
}

export async function adminApprove(reviewId: number, action: 'approve' | 'reject') {
  return prisma.feedback.update({
    where: { id: reviewId },
    data: { isApproved: action === 'approve' },
    include: { product: true, customer: true },
  });
}

export async function getAdminDetail(reviewId: number) {
  return prisma.feedback.findUnique({
    where: { id: reviewId },
    include: { product: { include: { category: true } }, customer: true },
  });
}

export async function deleteFeedback(reviewId: number) {
  return prisma.feedback.delete({ where: { id: reviewId } });
}

export async function toggleFavorite(customerId: number, productId: number) {
  const existing = await prisma.favorite.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { is_favorited: false };
  } else {
    await prisma.favorite.create({ data: { customerId, productId } });
    return { is_favorited: true };
  }
}

export async function getFavoritesList(customerId: number) {
  return prisma.favorite.findMany({
    where: { customerId },
    include: { product: { include: { category: true, offers: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFavoriteIds(customerId: number, productId?: number) {
  if (productId) {
    const fav = await prisma.favorite.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    return { is_favorited: !!fav, favorite_ids: fav ? [productId] : [] };
  }

  const favorites = await prisma.favorite.findMany({
    where: { customerId },
    select: { productId: true },
  });
  return { favorite_ids: favorites.map((f) => f.productId) };
}

export async function searchProducts(search: string) {
  return prisma.product.findMany({
    where: { productName: { contains: search, mode: 'insensitive' } },
    include: { category: true },
    orderBy: { productName: 'asc' },
  });
}

export async function searchOrders(orderId: string) {
  return prisma.order.findMany({
    where: { orderNumber: { contains: orderId, mode: 'insensitive' } },
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function bulkPriceUpdate(categoryId: number, priceAdjustment: number, adjustmentType: 'fixed' | 'percentage') {
  const products = await prisma.product.findMany({ where: { categoryId } });
  const updates = await Promise.all(
    products.map(async (p) => {
      const newPrice = adjustmentType === 'percentage'
        ? Math.round(p.price * (1 + priceAdjustment / 100) * 100) / 100
        : p.price + priceAdjustment;
      return prisma.product.update({
        where: { id: p.id },
        data: { price: newPrice < 0 ? 0 : newPrice },
        select: { id: true, productName: true, price: true },
      });
    })
  );
  return { updated_count: updates.length, products: updates };
}

export async function getProductsByCategory(categoryId: number) {
  const now = new Date();
  return prisma.product.findMany({
    where: { categoryId, isActive: true },
    include: {
      category: true,
      offers: {
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
