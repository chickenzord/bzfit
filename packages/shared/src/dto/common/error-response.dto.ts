import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response format
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or array of validation errors',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
    example: 'Validation failed',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Error type identifier',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of when the error occurred',
    example: '2026-02-11T05:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/api/v1/foods',
  })
  path: string;
}

/**
 * Validation error details
 */
export class ValidationErrorDto {
  @ApiProperty({
    description: 'Field that failed validation',
    example: 'email',
  })
  field: string;

  @ApiProperty({
    description: 'Validation constraint that failed',
    example: 'isEmail',
  })
  constraint: string;

  @ApiProperty({
    description: 'Error message',
    example: 'email must be an email',
  })
  message: string;
}
