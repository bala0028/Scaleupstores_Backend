import prisma from '../../config/db';

export async function create(name: string, email: string, phone: string, message: string) {
  return prisma.contactMessage.create({
    data: { name, email, phone, message },
  });
}

export async function getAll() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: number) {
  return prisma.contactMessage.findUnique({ where: { id } });
}

export async function remove(id: number) {
  return prisma.contactMessage.delete({ where: { id } });
}
