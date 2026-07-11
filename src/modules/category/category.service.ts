import prisma from '../../config/db';
import { uploadFile, deleteFile } from '../../config/aws';

export async function create(data: { categoryName: string; description?: string; image?: string }) {
  return prisma.category.create({ data });
}

export async function getAllAdmin() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { id: 'desc' },
  });
}

export async function getByIdAdmin(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
}

export async function update(id: number, data: { categoryName?: string; description?: string; image?: string }, oldImageUrl?: string | null) {
  if (oldImageUrl && data.image) {
    await deleteFile(oldImageUrl);
  }
  return prisma.category.update({ where: { id }, data });
}

export async function remove(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new Error('Category not found');
  if (category._count.products > 0) throw new Error('Cannot delete category with existing products');
  if (category.image) {
    await deleteFile(category.image);
  }
  return prisma.category.delete({ where: { id } });
}

export async function getAllPublic() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { id: 'desc' },
  });
}

export async function getByIdPublic(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: { products: { where: { isActive: true } } },
  });
}
