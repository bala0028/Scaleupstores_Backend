import Fastify, { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { env } from './config/env';
import { registerAuthPlugin } from './plugins/auth.plugin';
import { registerDbPlugin } from './plugins/db.plugin';
import { registerSwaggerPlugin } from './plugins/swagger.plugin';
import { registerRateLimit } from './middlewares/rateLimit.middleware';
import { registerMultipartPlugin } from './plugins/multipart.plugin';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify().withTypeProvider<TypeBoxTypeProvider>() as unknown as FastifyInstance;

  // Plugins
  await registerDbPlugin(app);
  await registerAuthPlugin(app);
  await registerRateLimit(app);
  await registerSwaggerPlugin(app);
  await registerMultipartPlugin(app);

  // Serve uploaded files
  const publicDir = path.resolve(__dirname, '../public');
  app.register(fastifyStatic, { root: publicDir, prefix: '/' });

  // Health check
  app.get('/api/health', async () => {
    return { status: true, message: 'ScaleUpStores API is running', timestamp: new Date().toISOString() };
  });

  // Module routes
  const { default: authRoutes } = await import('./modules/auth/auth.routes');
  const { default: userRoutes } = await import('./modules/user/user.routes');
  const { default: categoryRoutes } = await import('./modules/category/category.routes');
  const { default: productRoutes } = await import('./modules/product/product.routes');
  const { default: orderRoutes } = await import('./modules/order/order.routes');
  const { default: paymentRoutes } = await import('./modules/payment/payment.routes');
  const { default: offerRoutes } = await import('./modules/offer/offer.routes');
  const { default: notificationRoutes } = await import('./modules/notification/notification.routes');
  const { default: adminRoutes } = await import('./modules/admin/admin.routes');
  const { default: contactRoutes } = await import('./modules/contact/contact.routes');
  const { default: dashboardRoutes } = await import('./modules/dashboard/dashboard.routes');

  await app.register(authRoutes, { prefix: '/api' });
  await app.register(userRoutes, { prefix: '/api' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(productRoutes, { prefix: '/api' });
  await app.register(orderRoutes, { prefix: '/api' });
  await app.register(paymentRoutes, { prefix: '/api' });
  await app.register(offerRoutes, { prefix: '/api' });
  await app.register(notificationRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/api' });
  await app.register(contactRoutes, { prefix: '/api' });
  await app.register(dashboardRoutes, { prefix: '/api' });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      status: false,
      message: error.message || 'Internal server error',
      errors: error.validation || undefined,
    });
  });

  return app;
}