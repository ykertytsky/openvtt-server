import { config } from 'dotenv';
config({ path: '.env.local' });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Log all incoming requests
  app.use((req: any, res: any, next: any) => {
    logger.log(`→ ${req.method} ${req.url}`);
    next();
  });

  // Enable CORS for the frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  logger.log(`Enabling CORS for: ${frontendUrl}`);
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return `${error.property}: ${constraints.join(', ')}`;
        });
        logger.error(`Validation failed: ${messages.join('; ')}`);
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  // Use different port than frontend (which uses 3000)
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(
    `JWT_SECRET is ${process.env.JWT_SECRET ? 'set' : 'NOT SET (using default)'}`,
  );
}
bootstrap();
