import { FastifyReply, FastifyRequest } from 'fastify';
import { sendSuccess, sendServerError } from '../../utils/response';
import * as adminService from './admin.service';

export async function getDashboard(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const dashboard = await adminService.getDashboard();
    return sendSuccess(reply, dashboard);
  } catch (error) {
    return sendServerError(reply, error);
  }
}
