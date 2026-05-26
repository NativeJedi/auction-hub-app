import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

const BASE_URL = 'api/v1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
