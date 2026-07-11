import { buildApp } from './app';
import { env } from './config/env';

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
    console.log(`📚 API base: http://${env.HOST}:${env.PORT}/api`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
