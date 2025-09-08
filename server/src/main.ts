import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

const BASE_URL = 'api/v1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
