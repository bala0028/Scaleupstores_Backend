import bcrypt from 'bcryptjs';
import prisma from '../../config/db';

export async function updateCustomer(id: number, data: { full_name?: string; address?: string; dob?: string; gender?: string }) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return null;

  const updateData: any = {};
  if (data.full_name !== undefined) updateData.fullName = data.full_name;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.dob !== undefined) updateData.dob = data.dob;
  if (data.gender !== undefined) updateData.gender = data.gender;

  return prisma.customer.update({ where: { id }, data: updateData });
}

export async function listCustomers() {
  return prisma.customer.findMany();
}

export async function getCustomerById(id: number) {
  return prisma.customer.findUnique({ where: { id } });
}

export async function listAdmins() {
  return prisma.admin.findMany({
    select: { id: true, fullName: true, email: true, isAdmin: true, createdAt: true, updatedAt: true },
  });
}

export async function createAdmin(fullName: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.admin.create({
    data: { fullName, email, password: hashedPassword },
    select: { id: true, fullName: true, email: true, isAdmin: true, createdAt: true, updatedAt: true },
  });
}

export async function getAdminById(id: number) {
  return prisma.admin.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true, isAdmin: true, createdAt: true, updatedAt: true },
  });
}

export async function updateAdmin(id: number, data: { full_name?: string; email?: string; password?: string }) {
  const updateData: any = {};
  if (data.full_name !== undefined) updateData.fullName = data.full_name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.password !== undefined) updateData.password = await bcrypt.hash(data.password, 10);

  return prisma.admin.update({
    where: { id },
    data: updateData,
    select: { id: true, fullName: true, email: true, isAdmin: true, createdAt: true, updatedAt: true },
  });
}

export async function deleteAdmin(id: number) {
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) return null;
  await prisma.admin.delete({ where: { id } });
  return admin;
}
