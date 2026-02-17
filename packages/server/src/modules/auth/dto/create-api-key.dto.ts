import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'MCP Server' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['read:meals', 'write:foods'],
    description: 'Array of permission scopes',
    isArray: true,
    type: String
  })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiProperty({
    example: '2027-12-31T23:59:59Z',
    required: false,
    description: 'Optional expiration date'
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
