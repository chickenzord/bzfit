import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: { email: string; password: string }) {
    // TODO: Implement login logic
    return { message: 'Auth endpoint - to be implemented' };
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  async register(@Body() registerDto: { email: string; password: string; name?: string }) {
    // TODO: Implement registration logic
    return { message: 'Registration endpoint - to be implemented' };
  }
}
