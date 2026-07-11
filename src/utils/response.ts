import { FastifyReply } from 'fastify';
import { ApiResponse } from '../types';

export function sendSuccess(reply: FastifyReply, data: any = null, message: string = 'Success', statusCode: number = 200) {
  const response: ApiResponse = { status: true, data, message };
  return reply.status(statusCode).send(response);
}

export function sendError(reply: FastifyReply, message: string = 'Error', statusCode: number = 400, errors: any = null) {
  const response: ApiResponse = { status: false, message, errors };
  return reply.status(statusCode).send(response);
}

export function sendUnauthorized(reply: FastifyReply, message: string = 'Unauthorized') {
  return sendError(reply, message, 401);
}

export function sendNotFound(reply: FastifyReply, message: string = 'Not found') {
  return sendError(reply, message, 404);
}

export function sendForbidden(reply: FastifyReply, message: string = 'Forbidden') {
  return sendError(reply, message, 403);
}

export function sendServerError(reply: FastifyReply, error: any) {
  console.error('Server Error:', error);
  const message = error?.message || error?.toString() || 'Internal server error';
  return sendError(reply, message, 500, error?.code ? { code: error.code, meta: error.meta } : null);
}
