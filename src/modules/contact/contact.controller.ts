import { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess, sendError, sendNotFound, sendServerError } from '../../utils/response';
import * as contactService from './contact.service';

export async function createContactMessage(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, email, phone, message } = request.body as any;
    if (!name) return sendError(reply, 'Name is required', 400);
    if (!email) return sendError(reply, 'Email is required', 400);
    if (!phone) return sendError(reply, 'Phone is required', 400);
    if (!message) return sendError(reply, 'message is required', 400);

    const contact = await contactService.create(name, email, phone, message);
    return sendSuccess(reply, contact, 'Message sent', 201);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function listContactMessages(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const messages = await contactService.getAll();
    return sendSuccess(reply, messages);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function getContactMessageById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const message = await contactService.getById(parseInt(id));
    if (!message) return sendNotFound(reply, 'Message not found');
    return sendSuccess(reply, message);
  } catch (error) {
    return sendServerError(reply, error);
  }
}

export async function deleteContactMessage(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const existing = await contactService.getById(parseInt(id));
    if (!existing) return sendNotFound(reply, 'Message not found');
    await contactService.remove(parseInt(id));
    return sendSuccess(reply, null, 'Message deleted');
  } catch (error) {
    return sendServerError(reply, error);
  }
}
