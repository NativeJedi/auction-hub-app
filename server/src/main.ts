// MUST stay the first import — see the comment inside.
import './instrument';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis-io.adapter';
import { AppConfig } from './config/app.config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

const BASE_URL = 'api/v1';

async function bootstrap() {
  // bufferLogs: hold logs written during startup until useLogger() below
  // swaps Nest's default logger for pino — nothing is lost or double-formatted.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // From here on, every `new Logger(...)` in the app (email, redis, auth...)
  // writes through pino: JSON in prod, pretty in dev. No call sites change.
  app.useLogger(app.get(Logger));

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(process.env.REDIS_URL!);
  app.useWebSocketAdapter(redisIoAdapter);

  // Defense-in-depth headers for the API surface: nosniff, frame-ancestors,
  // referrer-policy, HSTS. The auth page HTML is served by Next — its own
  // CSP/HSTS must be configured separately in next.config.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix(BASE_URL);

  // Catch-all: logs every unhandled exception (5xx with stack) and keeps
  // internal details out of client responses.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Auction hub API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(`${BASE_URL}/docs`, app, document);

  // Single validated source for the port (fed by env PORT, which compose maps
  // from API_PORT). No raw process.env read, no duplicate hardcoded fallback.
  await app.listen(AppConfig.PORT);
}
void bootstrap();
