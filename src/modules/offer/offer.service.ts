import prisma from '../../config/db';

export async function createOffer(data: {
  categoryId?: number | null;
  productId?: number | null;
  offerName: string;
  offerPercentage?: number | null;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}) {
  return prisma.offer.create({
    data: {
      categoryId: data.categoryId ?? null,
      productId: data.productId ?? null,
      offerName: data.offerName,
      offerPercentage: data.offerPercentage ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? true,
    },
    include: { category: true, product: true },
  });
}

export async function getAllOffers() {
  return prisma.offer.findMany({
    include: { category: true, product: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOfferById(id: number) {
  return prisma.offer.findUnique({
    where: { id },
    include: { category: true, product: true },
  });
}

export async function updateOffer(id: number, data: Record<string, any>) {
  const updateData: any = {};
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.productId !== undefined) updateData.productId = data.productId;
  if (data.offerName !== undefined) updateData.offerName = data.offerName;
  if (data.offerPercentage !== undefined) updateData.offerPercentage = data.offerPercentage;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  return prisma.offer.update({
    where: { id },
    data: updateData,
    include: { category: true, product: true },
  });
}

export async function deleteOffer(id: number) {
  return prisma.offer.delete({ where: { id } });
}

export async function getProductsByCategory(categoryId: number) {
  return prisma.product.findMany({
    where: { categoryId },
    include: { category: true },
    orderBy: { productName: 'asc' },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    include: { category: true },
    orderBy: { productName: 'asc' },
  });
}

export async function getActiveOffers() {
  const now = new Date();
  return prisma.offer.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: { category: true, product: true },
    orderBy: { createdAt: 'desc' },
  });
}
