import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const corsOriginEnv = configService.get('CORS_ORIGIN') || 'http://localhost:3000';

  // Parse comma-separated origins and build allowed list
  const allowedOrigins = corsOriginEnv.split(',').map((o: string) => o.trim()).filter(Boolean);

  // CORS - supports multiple origins + Vercel preview URLs
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Check explicit list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Allow any *.vercel.app preview URL
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        callback(null, true);
        return;
      }
      // Allow localhost on any port (for dev)
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // API prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`🚀 COMPANIO API running on http://localhost:${port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')} + *.vercel.app + localhost:*`);
}
bootstrap();
