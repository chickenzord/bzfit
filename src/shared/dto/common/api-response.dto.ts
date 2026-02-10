import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic success response wrapper
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  @ApiProperty({
    description: 'Optional message',
    required: false,
  })
  message?: string;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T = any> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
