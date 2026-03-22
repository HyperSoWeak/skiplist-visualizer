import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

function flattenValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const messages = error.constraints ? Object.values(error.constraints) : [];
    const children = error.children
      ? flattenValidationErrors(error.children)
      : [];
    return [...messages, ...children];
  });
}

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          success: false,
          message:
            flattenValidationErrors(errors).join('; ') || 'Validation failed',
          actionType: 'validation',
          targetValue: null,
          steps: [],
          finalState: null,
          coinFlips: [],
          showAlert: true,
        }),
    }),
  );
}
