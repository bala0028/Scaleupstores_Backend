import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../types';
import { sendSuccess, sendError, sendServerError, sendNotFound } from '../../utils/response';
import * as userService from './user.service';

export async function updateCustomerDetails(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const userId = (request.params as any).id ? parseInt((request.params as any).id, 10) : request.user!.id;
    const { full_name, address, dob, gender } = request.body as any;
    const customer = await userService.updateCustomer(userId, { full_name, address, dob, gender });
    if (!customer) return sendNotFound(reply, 'Customer not found');
    return sendSuccess(reply, customer, 'Customer details updated');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listCustomers(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const customers = await userService.listCustomers();
    return sendSuccess(reply, customers, 'Customers fetched');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getCustomerById(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const id = parseInt((request.params as any).id, 10);
    const customer = await userService.getCustomerById(id);
    if (!customer) return sendNotFound(reply, 'Customer not found');
    return sendSuccess(reply, customer, 'Customer fetched');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listAdmins(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const admins = await userService.listAdmins();
    return sendSuccess(reply, admins, 'Admins fetched');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function createAdmin(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const { full_name, email, password } = request.body as any;
    if (!full_name || !email || !password) return sendError(reply, 'full_name, email and password are required');
    const admin = await userService.createAdmin(full_name, email, password);
    return sendSuccess(reply, admin, 'Admin created', 201);
  } catch (error: any) {
    if (error.code === 'P2002') return sendError(reply, 'Email already exists');
    return sendServerError(reply, error);
  }
}

export async function getAdminById(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const id = parseInt((request.params as any).id, 10);
    const admin = await userService.getAdminById(id);
    if (!admin) return sendNotFound(reply, 'Admin not found');
    return sendSuccess(reply, admin, 'Admin fetched');
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function updateAdmin(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const id = parseInt((request.params as any).id, 10);
    const { full_name, email, password } = request.body as any;
    const admin = await userService.updateAdmin(id, { full_name, email, password });
    return sendSuccess(reply, admin, 'Admin updated');
  } catch (error: any) {
    if (error.code === 'P2002') return sendError(reply, 'Email already exists');
    return sendServerError(reply, error);
  }
}

export async function deleteAdmin(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const id = parseInt((request.params as any).id, 10);
    const admin = await userService.deleteAdmin(id);
    if (!admin) return sendNotFound(reply, 'Admin not found');
    return sendSuccess(reply, admin, 'Admin deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}
