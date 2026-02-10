import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Descriptive name for the API key',
    example: 'Mobile App API Key',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Array of permission scopes',
    example: ['read:meals', 'write:foods'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  scopes: string[];

  @ApiProperty({
    description: 'Optional expiration date (ISO 8601 format)',
    example: '2027-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
