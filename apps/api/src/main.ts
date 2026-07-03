import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = ['http://localhost:5173'];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.use(cookieParser());

  // Global middleware to prevent browser caching of API responses (security best practice)
  app.use((req: any, res: any, next: any) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 API running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(
    `💬 WebSocket available on ws://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
