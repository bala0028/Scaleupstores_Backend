import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  id: number;
  email?: string;
  isAdmin?: boolean;
  type: 'customer' | 'admin';
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message: string;
  errors?: any;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface OrderItemInput {
  product: number;
  quantity: number;
  price: number;
  tax?: number;
  total: number;
}

export interface ReserveOrderInput {
  items: Array<{ product: number; quantity: number }>;
  payment_method: 'online' | 'cod';
  order_data: {
    customer: number;
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    secondaryNumber?: string;
    shippingAddress: string;
    billingAddress?: string;
    subtotal?: number;
    tax?: number;
    shippingCost?: number;
    totalAmount?: number;
    items: OrderItemInput[];
  };
}
