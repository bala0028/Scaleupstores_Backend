import { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';
import { sendUnauthorized } from '../utils/response';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(reply, 'No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyAccessToken(token);
    (request as any).user = decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(reply, 'Token expired');
    }
    return sendUnauthorized(reply, 'Invalid token');
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || !user.isAdmin) {
    return sendUnauthorized(reply, 'Admin access required');
  }
}
