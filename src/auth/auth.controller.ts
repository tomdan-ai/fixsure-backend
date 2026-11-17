import { Controller, Post, Get, Body, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';
import { CurrentToken } from '../common/auth.decorator';

@ApiTags('Auth')
@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user (MANAGER, TECHNICIAN, or ADMIN)' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.phone, dto.password, dto.role);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful with token' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and derived trust badges' })
  @ApiResponse({ status: 200, description: 'Profile details and badges' })
  async me(@CurrentToken() token: string) {
    return this.authService.getMe(token);
  }

  @Put('auth/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile information' })
  async updateProfile(@CurrentToken() token: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(token, dto);
  }
}
