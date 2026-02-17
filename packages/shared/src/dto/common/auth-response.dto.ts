import { ApiProperty } from '@nestjs/swagger';

/**
 * Response from login/register endpoints
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * Response from API key creation
 */
export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'API key ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The generated API key (only shown once)',
    example: 'bzfit_live_abc123def456...',
  })
  key: string;

  @ApiProperty({
    description: 'API key name',
    example: 'Mobile App API Key',
  })
  name: string;

  @ApiProperty({
    description: 'Permission scopes',
    example: ['read:meals', 'write:foods'],
  })
  scopes: string[];

  @ApiProperty({
    description: 'Expiration date',
    example: '2027-12-31T23:59:59.000Z',
    required: false,
  })
  expiresAt?: string;
}
